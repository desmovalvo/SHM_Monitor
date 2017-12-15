var devTypes = {};
var sc = null;
var jsap = null;

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

function clearSEPA(){

    // iterate over servers
    for (server in jsap["extended"]["servers"]){

	// check if server is enabled
	if (!(document.getElementById(server + "_enabled").checked))
	    continue;
	
	// get the update uri
	updateURI = document.getElementById(server + "_updateURI").value;
	
	// debug
	sc.doUpdate(updateURI, "DELETE { ?s ?p ?o } WHERE { ?s ?p ?o }");
    }

}

function loadJSAP(){

    // debug
    console.log("[DEBUG] invoked loadJSAP function");
    
    //check if file reader is supported
    if ( ! window.FileReader ) {
	console.log("[ERROR] FileReader API is not supported by your browser.");
	return false;
    }
    
    // clear all the tables
    devTable = document.getElementById("devTypesTable");
    eventsTable = document.getElementById("eventsTable");
    actionsTable = document.getElementById("actionsTable");
    propertiesTable = document.getElementById("propertiesTable");
    clearTable(devTable);
    clearTable(eventsTable);
    clearTable(actionsTable);
    clearTable(propertiesTable);	    
    
    // load data
    var $i = $('#formFile1');		
    input = $i[0];
    if (input.files && input.files[0]) {
	file = input.files[0];
	
	// create a mew instance of the file reader
	fr = new FileReader();		    
	var text;
	fr.onload = function () {
	    
	    // read the content of the file and create a SEPA Client
	    var decodedData = fr.result;
	    jsap = JSON.parse(decodedData);
	    sc = new SEPAClient();
	    sc.getJsap(decodedData);
    
	    // parse the extended section for the list of endpoints
	    for (k in jsap["extended"]["servers"]){	
		document.getElementById("URIform").innerHTML += '<i class="fa fa-bolt" aria-hidden="true"></i>&nbsp;Subscribe URL (' + k + ')' +
		    '<input type="text" class="form-control" id="' + k + '_subscribeURI" value=' + jsap["extended"]["servers"][k]["subscribeURI"] + '>';
		document.getElementById("URIform").innerHTML += '<i class="fa fa-upload" aria-hidden="true"></i>&nbsp;Update URL (' + k + ')' +
		    '<input type="text" class="form-control" id="' + k + '_updateURI" value=' + jsap["extended"]["servers"][k]["updateURI"] + '>';
		document.getElementById("URIform").innerHTML += '<input type="checkbox" name="' + k + '_enabled" id="' + k + '_enabled" value="-">&nbsp;Enabled<br><br>';
	    }

	    // load device types
	    devTypes = sc.jsap["extended"]["devices"];
	    for (dev in devTypes){
		newRow = devTable.insertRow(0);
		newRow.insertCell(0).innerHTML = "<div contenteditable id=" + dev + ">" + devTypes[dev]["number"] + "</div>";		
		newRow.insertCell(0).innerHTML = dev;
		
		// load properties types
		for (act in sc.jsap["extended"]["devices"][dev]["actions"]){
		    newRow = actionsTable.insertRow(0);
		    newRow.insertCell(0).outerHTML = sc.jsap["extended"]["devices"][dev]["actions"][act].split("|")[0] + " <i>(" + dev + ")</i>";
		}	    	    
		for (prop in sc.jsap["extended"]["devices"][dev]["properties"]){
		    newRow = propertiesTable.insertRow(0);
		    newRow.insertCell(0).outerHTML = sc.jsap["extended"]["devices"][dev]["properties"][prop].split("|")[0] + " <i>(" + dev + ")</i>";
		}
		for (ev in sc.jsap["extended"]["devices"][dev]["events"]){
		    newRow = eventsTable.insertRow(0);
		    newRow.insertCell(0).outerHTML = sc.jsap["extended"]["devices"][dev]["events"][ev].split("|")[0] + " <i>(" + dev + ")</i>";
		}	    	    
		
	    }	    	    
	};
	fr.readAsText(file);		
    }
}

function startSim(){

    // get the log window
    logWindow = document.getElementById("logWindow");

    // iterate over the servers
    for (server in jsap["extended"]["servers"]){

	// check if server is enabled
	if (!(document.getElementById(server + "_enabled").checked))
	    continue;
	
	// get the update uri
	updateURI = document.getElementById(server + "_updateURI").value;
	
	// iterate over the classes of devices
	for (devType in devTypes){

	    // get the thing URI and name scheme
	    console.log(devTypes[devType]["thing"].split("|"));
	    var thingURIScheme = null;
	    var thingNameScheme = null;
	    [thingURIScheme, thingNameScheme] = devTypes[devType]["thing"].split("|");
	    console.log([thingURIScheme, thingNameScheme]);
	    console.log(thingURIScheme, thingNameScheme);
	    // create the right number of instances
	    devNumber = document.getElementById(devType).innerHTML;
	    console.log("[DEBUG] Creating " + devNumber + " instances of " + devTypes[devType]["thing"]);
	    
	    for (i = 0; i < devNumber; i++){

		// generate real thing URI and name
		var uuid = generateUUID();
		console.log("++ generato: " + uuid);
		console.log("++ thingURIScheme: " + thingURIScheme);
		thingURI = thingURIScheme.replace("$(UUID)", uuid);
		thingName = thingNameScheme.replace("$(UUID)", uuid);
		console.log(thingURI);
		sc.doUpdate(updateURI, sc.getUpdate("ADD_NEW_THING", {"thing":thingURI, "name":thingName}), "ADD_NEW_THING",
			    function(msg){
				logWindow.innerHTML += '<i class="fa fa-check" aria-hidden="true"></i> ' + msg + "<br>";
			    },
			    function(msg){
				logWindow.innerHTML += '<i class="fa fa-times" aria-hidden="true"></i> ' + msg + "<br>";
			    });
		
		// generate properties
		for (prop in devTypes[devType]["properties"]){
	    	    [propURI,propName] = devTypes[devType]["properties"][prop].split("|");
		    sc.doUpdate(updateURI, sc.getUpdate("ADD_PROPERTY", {"thing":thingURI, "property":propURI, "propName":propName}), "ADD_PROPERTY",
				function(msg){
				    logWindow.innerHTML += '<i class="fa fa-check" aria-hidden="true"></i>' + msg + '<br>';
				},
				function(msg){
				    logWindow.innerHTML += '<i class="fa fa-times" aria-hidden="true"></i>' + msg + '<br>';
				});		
		}
		
		// generate events
		for (event in devTypes[devType]["events"]){
	    	    [eventURI,eventName] = devTypes[devType]["events"][event].split("|");
		    sc.doUpdate(updateURI, sc.getUpdate("ADD_EVENT", {"event":eventURI, "thing":thingURI, "eName":eventName, "outDataSchema":"-"}), "ADD_EVENT",
				function(msg){
				    logWindow.innerHTML += '<i class="fa fa-check" aria-hidden="true"></i>' + msg + '<br>';
				},
				function(msg){
				    logWindow.innerHTML += '<i class="fa fa-times" aria-hidden="true"></i>' + msg + '<br>';
				});				
		}
		
		// generate actions
		for (action in devTypes[devType]["actions"]){
	    	    [actionURI,actionName] = devTypes[devType]["actions"][action].split("|");
		    sc.doUpdate(updateURI, sc.getUpdate("ADD_NEW_ACTION", {"thing":thingURI, "action":actionURI, "actionName":actionName}), "ADD_NEW_ACTION",
				function(msg){
				    logWindow.innerHTML += '<i class="fa fa-check" aria-hidden="true"></i>' + msg + '<br>';
				},
				function(msg){
				    logWindow.innerHTML += '<i class="fa fa-times" aria-hidden="true"></i>' + msg + '<br>';
				});	
		}

		// generate worker to send ping	    
		// startWorker(thingURI);
		
	    }
	    
	}
    }
    
}

function clearTable(table){
    while(table.rows.length > 1) {
	table.deleteRow(-1);
    };
}

function getStatistics() {

    // TIME GRAPHS
    
    // updates
    var traces = [];

    // global indicator for updates
    traces.push({
	y: sc.updateTimes,
	type: 'box',
	boxpoints: 'all',
	name: 'Total'
    });

    // indicator for labeled updates 
    for (srv in sc.updateByLabel){
	console.log(srv);
	for (lbl in sc.updateByLabel[srv]){
	    console.log(srv, lbl);
	    traces.push({
		y: sc.updateByLabel[srv][lbl],
		type: 'box',
		boxpoints: 'all',
		name: lbl + "(" + srv + ")"
	    });
	}
    };
    
    var data = traces;
    console.log(data);
    // set chart layout
    var layout = {
	title: 'SEPA performance data'
    };

    // plot!
    Plotly.newPlot('updateTimeCharts', data, layout);
    
    // SUCCESS GRAPH
    console.log([sc.updateRequestsSucc, sc.updateRequestsFail]);
    var data = [];
    for (srv in sc.updateRequests){
	data.push({
	    x: ['Success (' + srv + ')', 'Failure (' + srv + ')'],
	    y: [sc.updateRequestsSucc[srv], sc.updateRequestsFail[srv]],
	    type: 'bar',
	    name: srv
	});
    }
    // set chart layout
    var layout = {
	title: 'SEPA success ratio',
	barmode: 'stack'
    };
    console.log(data);
    Plotly.newPlot('updateFailure', data, layout);

    
}

function clearLog(){
    document.getElementById("logWindow").innerHTML = "";
}

function clearStats(){
    console.log("[INFO] clearStats() invoked");
    sc.resetStats();
    document.getElementById("updateTimeCharts").innerHTML = "";
    document.getElementById("updateFailure").innerHTML = "";
}

function startWorker(thingURI){
    if(typeof(Worker) !== "undefined") {
        if(typeof(w) == "undefined") {
            w = new Worker("ping.js");
	    console.log(thingURI);
	    w.postMessage(thingURI);
        }
        w.onmessage = function(event) {
            document.getElementById("logWindow").innerHTML = event.data;
        };
    } else {
        document.getElementById("logWindow").innerHTML = "Sorry! No Web Worker support.";
    }
}
