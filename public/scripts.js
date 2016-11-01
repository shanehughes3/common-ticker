const $ = document.getElementById.bind(document);

window.addEventListener("DOMContentLoaded", setup);

function setup() {
    const addSymbolBox = new NewSymbolBox();
    $("symbols-container").appendChild(addSymbolBox.drawBox());
}

/* WEBSOCKET
 */

const socket = new WebSocket(generateWSServerURL(), "ticker");
socket.onerror = function(err) {
    console.log(err); //////////////////
};
socket.onmessage = function(message) {
    console.log(message); /////////////////////
};

function generateWSServerURL() {
    const loc = window.location;
    let output;
    output = (loc.protocol == "https:") ? "wss:" : "ws:";
    output += "//" + loc.host;
    return output;
}

function sendAddSymbol() {
    const payload = {
	verb: "add",
	symbol: $("add-symbol-field").value
    };
    socket.send(JSON.stringify(payload));
}

function sendDeleteSymbol(symbol) {
    const payload = {
	verb: "delete",
	symbol: symbol
    };
}

/* DISPLAY
 */

function DisplayBox() {
    this.createContainer = function() {
	let div = document.createElement("div");
	div.setAttribute("class", "display-box");
	return div;
    }
}

function SymbolBox(symbol) {
    this.drawBox = function() {
	let div = createContainer();
	div.innerHTML =
	    `<span>${symbol}</span>`;
	return div;
    };
}
SymbolBox.prototype = new DisplayBox();

function NewSymbolBox() {
    this.drawBox = function() {
	let div = this.createContainer();
	div.appendChild(drawForm());
	return div;
    };

    function drawForm() {
	let form = document.createElement("form");
	form.setAttribute("action", "javascript:void(0)");

	let textInput = document.createElement("input");
	textInput.setAttribute("type", "text");
	textInput.setAttribute("id", "add-symbol-field");
	textInput.setAttribute("placeholder", "Symbol");

	let submitButton = document.createElement("button");
	submitButton.setAttribute("id", "submit-new-button");
	submitButton.textContent = "Add Ticker";
	submitButton.onclick = sendAddSymbol;

	form.appendChild(textInput);
	form.appendChild(submitButton);

	return form;
    }
}
NewSymbolBox.prototype = new DisplayBox();

