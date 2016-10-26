const $ = document.getElementById.bind(document);

window.addEventListener("DOMContentLoaded", setup);

function setup() {
    const socket = new WebSocket(generateWSServerURL(), "test-protocol");
    socket.onerror = function(err) {
	console.log(err);
    };
    socket.onmessage = function(message) {
	console.log(message);
    };
    bindButtons(socket);
}

function generateWSServerURL() {
    const loc = window.location;
    let output;
    output = (loc.protocol == "https:") ? "wss:" : "ws:";
    output += "//" + loc.host;
    return output;
}

function bindButtons(socket) {
    $("submit-button").onclick = function() {
	socket.send($("text-field").value);
    };
}

