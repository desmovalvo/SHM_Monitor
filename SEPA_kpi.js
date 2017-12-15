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
    this.updateRequests = {};
    this.updateRequestsSucc = {};
    this.updateRequestsFail = {};
    this.updateTimes = []
    this.updateByLabel = {};
    
    //////////////////////////////////////////////////////////////
    //
    // methods
    //
    //////////////////////////////////////////////////////////////
    
    // parse the jsap
    this.getJsap = function (decodedJsap){

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
    this.doUpdate = function (updURI, updText, updLabel, successCallback, failureCallback){

	// update counters
	if (!(updURI in this.updateRequests)){
	    this.updateRequests[updURI] = 0;
	    this.updateRequestsSucc[updURI] = 0;
	    this.updateRequestsFail[updURI] = 0;
	}
	
	// update counters
	this.updateRequests[updURI] += 1;
	if (!(updURI in this.updateByLabel)){
	    this.updateByLabel[updURI] = [];
	}
	if (!(updLabel in this.updateByLabel[updURI])){
	    this.updateByLabel[updURI][updLabel] = [];
	}	

	// do the update
	var t0 = performance.now();
	var self = this;
	var req = $.ajax({
	    url: updURI,
	    crossOrigin: true,
	    method: 'POST',
	    contentType: "application/sparql-update",
	    data: updText,	
	    error: function(event){
		console.log("[SEPA kpi] Connection failed!" + updText);
		if (failureCallback !== undefined){
		    failureCallback(updLabel);
		    self.updateRequestsFail[updURI] += 1;
		}
	    },
	    success: function(data){
		if (successCallback !== undefined){
		    successCallback(updLabel);
		    self.updateRequestsSucc[updURI] += 1;
		}
	    }
	});
	var t1 = performance.now();
	tt = (t1-t0).toFixed(3);
	this.updateTimes.push(tt);
	this.updateByLabel[updURI][updLabel].push(tt);
    };
    
    // query
    this.doQuery = function (queryText){
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
		return true;	    
	    }
	});
    };

    // get update
    this.getUpdate = function (updateName, forcedBindings){
	
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

    // reset stats
    this.resetStats = function(){
    
        // reset attributes used for statistics
	this.updateRequests = {};
	this.updateRequestsSucc = {};
	this.updateRequestsFail = {};
	this.updateTimes = []
	this.updateByLabel = {};	
    }
    
}
