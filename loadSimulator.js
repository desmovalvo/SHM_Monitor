var devTypes = {};
var sc = null;

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

    // debug
    console.log("[DEBUG] clearSEPA invoked");
    sc.doUpdate("DELETE { ?s ?p ?o } WHERE { ?s ?p ?o }");

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
	    sc = new SEPAClient();
	    sc.getJsap(decodedData);
    
	    // load SEPA URIs
	    document.getElementById("sepaUpdateURL").value = sc.updateURI;
	    document.getElementById("sepaQueryURL").value = sc.queryURI;    
	    document.getElementById("sepaSubscribeURL").value = sc.subscribeURI;        

	    // load device types
	    devTypes = sc.jsap["extended"]["devices"];
	    for (dev in devTypes){
		newRow = devTable.insertRow(0);
		newRow.insertCell(0).outerHTML = dev;
		
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
    
    // iterate over the classes of devices
    for (devType in devTypes){
	console.log("[DEBUG] Creating " + devTypes[devType]["number"] + " instances of " + devTypes[devType]["thing"]);

	// get the thing URI and name scheme
	[thingURIScheme, thingNameScheme] = devTypes[devType]["thing"].split("|");
	
	// create the right number of instances
	for (i = 0; i < devTypes[devType]["number"]; i++){

	    // generate real thing URI and name
	    uuid = generateUUID();
	    thingURI = thingURIScheme.replace("$(UUID)", uuid);
	    thingName = thingNameScheme.replace("$(UUID)", uuid);	  
	    sc.doUpdate(sc.getUpdate("ADD_NEW_THING", {"thing":thingURI, "name":thingName}),
			function(){
			    logWindow.innerHTML += '<i class="fa fa-check" aria-hidden="true"></i> ADD_NEW_THING(' + thingURI + "," + thingName + ")<br>";
			},
			function(){
			    logWindow.innerHTML += '<i class="fa fa-times" aria-hidden="true"></i> ADD_NEW_THING(' + thingURI + "," + thingName + ")<br>";
			});
	    
	    // generate properties
	    for (prop in devTypes[devType]["properties"]){
	    	[propURI,propName] = devTypes[devType]["properties"][prop].split("|");
		sc.doUpdate(sc.getUpdate("ADD_PROPERTY", {"thing":thingURI, "property":propURI, "propName":propName}),
			function(){
			    logWindow.innerHTML += '<i class="fa fa-check" aria-hidden="true"></i> ADD_PROPERTY(' + thingURI + "," + propURI + "," + propName + ")<br>";
			},
			function(){
			    logWindow.innerHTML += '<i class="fa fa-times" aria-hidden="true"></i> ADD_PROPERTY(' + thingURI + "," + propURI + "," + propName + ")<br>";
			});		
	    }
	    
	    // generate events
	    for (event in devTypes[devType]["events"]){
	    	[eventURI,eventName] = devTypes[devType]["events"][event].split("|");
		sc.doUpdate(sc.getUpdate("ADD_EVENT", {"event":eventURI, "thing":thingURI, "eName":eventName, "outDataSchema":"-"}),
			    function(){
				logWindow.innerHTML += '<i class="fa fa-check" aria-hidden="true"></i> ADD_EVENT(' + eventURI + "," + thingURI + "," + eventName + ")<br>";
			    },
			    function(){
				logWindow.innerHTML += '<i class="fa fa-times" aria-hidden="true"></i> ADD_EVENT(' + eventURI + "," + thingURI + "," + eventName + ")<br>";
			    });				
	    }
	    
	    // generate actions
	    for (action in devTypes[devType]["actions"]){
	    	[actionURI,actionName] = devTypes[devType]["actions"][action].split("|");
		sc.doUpdate(sc.getUpdate("ADD_NEW_ACTION", {"thing":thingURI, "action":actionURI, "actionName":actionName}),
			    function(){
				logWindow.innerHTML += '<i class="fa fa-check" aria-hidden="true"></i> ADD_NEW_ACTION(' + thingURI + "," + actionURI + "," + actionName + ")<br>";
			    },
			    function(){
				logWindow.innerHTML += '<i class="fa fa-times" aria-hidden="true"></i> ADD_NEW_ACTION(' + thingURI + "," + actionURI + "," + actionName + ")<br>";
			    });	
	    }
	}
	
    }
    
}

function clearTable(table){
    while(table.rows.length > 1) {
	table.deleteRow(-1);
    };
}
