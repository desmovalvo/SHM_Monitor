//////////////////////////////////////////////////////////////
//
// SEPAClient
//
//////////////////////////////////////////////////////////////

function SEPAClient(){

    //////////////////////////////////////////////////////////////
    //
    // attributes
    //
    //////////////////////////////////////////////////////////////
    
    this.jsap = null;
    this.queryURI = null;
    this.updateURI = null;
    this.subscribeURI = null;
    this.prefixes = null;
    this.lastUpdate = null;

    // attributes used for statistics
    this.updateRequests = 0;
    this.updateRequestsSucc = 0;
    this.updateRequestsFail = 0;
    this.updateTimes = []
    
    //////////////////////////////////////////////////////////////
    //
    // methods
    //
    //////////////////////////////////////////////////////////////
    
    // parse the jsap
    this.getJsap = function (decodedJsap){

	// debug print
	console.log("getJsap invoked");

	// store the jsap
	this.jsap = JSON.parse(decodedJsap);
	
	// read URIs
	this.updateURI = "http://" + this.jsap["parameters"]["host"] + ":" + this.jsap["parameters"]["ports"]["http"] + this.jsap["parameters"]["paths"]["update"];
	this.queryURI = "http://" + this.jsap["parameters"]["host"] + ":" + this.jsap["parameters"]["ports"]["http"] + this.jsap["parameters"]["paths"]["query"];
	this.subscribeURI = "ws://" + this.jsap["parameters"]["host"] + ":" + this.jsap["parameters"]["ports"]["ws"] + this.jsap["parameters"]["paths"]["subscribe"];
	
	// read namespaces
	this.prefixes = "";
	for (ns in this.jsap["namespaces"]){
	    this.prefixes += "PREFIX " + ns + ": <" + this.jsap["namespaces"][ns] + "> ";
	}	
    };

    // update
    this.doUpdate = function (updText, successCallback, failureCallback){

	// debug print
	console.log("doUpdate invoked");

	// update counter
	this.updateRequests += 1;

	// do the update
	var t0 = performance.now();
	var req = $.ajax({
	    url: this.updateURI,
	    crossOrigin: true,
	    method: 'POST',
	    contentType: "application/sparql-update",
	    data: updText,	
	    error: function(event){
		console.log("[SEPA kpi] Connection failed!" + updText);
		if (failureCallback !== undefined)
		    failureCallback();		
	    },
	    success: function(data){
		console.log("[SEPA kpi] Connection succeeded!");
		if (successCallback !== undefined)
		    successCallback();
	    }
	});
	var t1 = performance.now();
	this.updateTimes.push((t1-t0).toFixed(3));
    };
    
    // query
    this.doQuery = function (queryText){
	console.log("doQuery invoked");
	var req = $.ajax({
	    url: this.queryURI,
	    crossOrigin: true,
	    method: 'POST',
	    contentType: "application/sparql-query",
	    data: queryText,	
	    error: function(event){
		console.log("[SEPA kpi] Connection failed!");
		return false;
	    },
	    success: function(data){
		console.log("[SEPA kpi] Connection succeeded!");
		return true;	    
	    }
	});
    };

    // get update
    this.getUpdate = function (updateName, forcedBindings){
	
    	// debug
    	console.log("[SEPA kpi] getUpdate invoked");

    	// replace forced bindings
    	var uqtext = this.jsap["updates"][updateName]["sparql"];
    	for (var c in forcedBindings){

	    if (c in this.jsap["updates"][updateName]["forcedBindings"]){

		var varname = c;
    		var varvalue = forcedBindings[c];
				
		if (this.jsap["updates"][updateName]["forcedBindings"][c]["type"] === "literal"){
    		    var r = new RegExp('\\?' + varname + '\\s+', 'g');
    		    uqtext = uqtext.replace(r, "'" + varvalue + "' ");
    		    r = new RegExp('\\?' + varname + '\\.', 'g');
    		    uqtext = uqtext.replace(r, "'" + varvalue + "' . ");
    		    r = new RegExp('\\?' + varname + '\\}', 'g');
    		    uqtext = uqtext.replace(r, "'" + varvalue + "' } ");
		}
		else {
    		    var r = new RegExp('\\?' + varname + '\\s+', 'g');
    		    uqtext = uqtext.replace(r, varvalue + " ");
    		    r = new RegExp('\\?' + varname + '\\.', 'g');
    		    uqtext = uqtext.replace(r, varvalue + ". ");
    		    r = new RegExp('\\?' + varname + '\\}', 'g');
    		    uqtext = uqtext.replace(r, varvalue + "} ");
		}
	    }
	    

    	};
    	return this.prefixes + uqtext;
    };

    // get query
    this.getQuery = function(queryName, forcedBindings){
	
    	// debug
    	console.log("[SEPA kpi] getQuery invoked");

    	// replace forced bindings
    	var uqtext = this.jsap["queries"][queryName]["sparql"]
    	for (var c in forcedBindings){
    	    var varname = c;
    	    var varvalue = forcedBindings[c];
    	    var r = new RegExp('\\?' + varname + '\\s+', 'g');
    	    uqtext = uqtext.replace(r, varvalue + " ");
    	    r = new RegExp('\\?' + varname + '\\.', 'g');
    	    uqtext = uqtext.replace(r, varvalue + ". ");
    	    r = new RegExp('\\?' + varname + '\\}', 'g');
    	    uqtext = uqtext.replace(r, varvalue + "} ");
    	};
    	return this.prefixes + uqtext;
    };
    
}
