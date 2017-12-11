devTypes = {};

function loadJSAP(){

    // debug
    console.log("[DEBUG] invoked loadJSAP function");    
    
    //check if file reader is supported
    if ( ! window.FileReader ) {
	console.log("[ERROR] FileReader API is not supported by your browser.");
	return false;
    }

    // load data
    var $i = $('#formFile1');		
    input = $i[0];
    if (input.files && input.files[0]) {
	file = input.files[0];
	console.log(file);
	
	// create a mew instance of the file reader
	fr = new FileReader();		    
	var text;
	fr.onload = function () {
	    
	    // read the content of the file
	    var decodedData = fr.result;
	    
	    // parse the JSON file
	    myJson = JSON.parse(decodedData);

	    // load SEPA URIs
	    uURI = "http://" + myJson["parameters"]["host"] + ":" + myJson["parameters"]["ports"]["http"] + myJson["parameters"]["paths"]["update"];	    
	    document.getElementById("sepaUpdateURL").value = uURI;	    
	    qURI = "http://" + myJson["parameters"]["host"] + ":" + myJson["parameters"]["ports"]["http"] + myJson["parameters"]["paths"]["query"];
	    document.getElementById("sepaQueryURL").value = qURI;    
	    sURI = "ws://" + myJson["parameters"]["host"] + ":" + myJson["parameters"]["ports"]["ws"] + myJson["parameters"]["paths"]["subscribe"];
	    document.getElementById("sepaSubscribeURL").value = sURI;        

	    // clear all the tables
	    devTable = document.getElementById("devTypesTable");
	    eventsTable = document.getElementById("eventsTable");
	    actionsTable = document.getElementById("actionsTable");
	    propertiesTable = document.getElementById("propertiesTable");
	    clearTable(devTable);
	    clearTable(eventsTable);
	    clearTable(actionsTable);
	    clearTable(propertiesTable);
	    
	    // load device types
	    devTypes = myJson["extended"]["devices"];
	    for (dev in myJson["extended"]["devices"]){
		newRow = devTable.insertRow(0);
		newRow.insertCell(0).outerHTML = dev;

		// load properties types
		for (act in myJson["extended"]["devices"][dev]["actions"]){
		    newRow = actionsTable.insertRow(0);
		    newRow.insertCell(0).outerHTML = myJson["extended"]["devices"][dev]["actions"][act] + " (" + dev + ")";
		}	    	    
		for (prop in myJson["extended"]["devices"][dev]["properties"]){
		    newRow = propertiesTable.insertRow(0);
		    newRow.insertCell(0).outerHTML = myJson["extended"]["devices"][dev]["properties"][prop] + " (" + dev + ")";
		}
		for (ev in myJson["extended"]["devices"][dev]["events"]){
		    newRow = eventsTable.insertRow(0);
		    newRow.insertCell(0).outerHTML = myJson["extended"]["devices"][dev]["events"][ev] + " (" + dev + ")";
		}	    	    
		
	    }	    	    
	    
	};
	fr.readAsText(file);	
	
    }
    
}


function startSim(){

    // iterate over the classes of devices
    console.log(devTypes);
    for (devType in devTypes){
	console.log(devType);
	console.log("Creating " + devTypes[devType]["number"] + " instances of " + devTypes[devType]["thing"]);

	for (action in devTypes[devType]["actions"]){
	    console.log(devTypes[devType]["actions"][action]);
	}
	
    }
    
}

function clearTable(table){
    while(table.rows.length > 1) {
	table.deleteRow(-1);
    };
}
