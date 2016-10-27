const $ = document.getElementById.bind(document);

window.addEventListener("DOMContentLoaded", setup);

function setup() {

}

const socket = new WebSocket(generateWSServerURL(), "ticker");
socket.onopen = () => bindSocketButtons(socket);
socket.onerror = function(err) {
    console.log(err);
};
socket.onmessage = function(message) {
    console.log(message);
};

function generateWSServerURL() {
    const loc = window.location;
    let output;
    output = (loc.protocol == "https:") ? "wss:" : "ws:";
    output += "//" + loc.host;
    return output;
}

function bindSocketButtons(socket) {
    $("submit-ticker-button").onclick = () => sendAddSymbol(socket);
}

function sendAddSymbol(socket) {
    const payload = {
	verb: "add",
	symbol: $("new-ticker-field").value
    };
    socket.send(JSON.stringify(payload));
}

function sendDeleteSymbol(socket, symbol) {
    const payload = {
	verb: "delete",
	symbol: symbol
    };
}
