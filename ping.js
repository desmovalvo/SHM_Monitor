var i = 0;
var thingURI = null;

self.onmessage = function (msg) {
    thingURI = msg.data;
}

function timedCount() {
    i = i + 1;
    postMessage("Ping from " + thingURI);
    setTimeout("timedCount()",500);
}

timedCount(); 
