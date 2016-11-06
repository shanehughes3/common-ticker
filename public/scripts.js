const $ = document.getElementById.bind(document);
let globalStocksList = [];

window.addEventListener("DOMContentLoaded", setup);

function setup() {
    const addSymbolBox = new AddFormBox();
    $("symbols-container").appendChild(addSymbolBox.drawBox());
}

/* WEBSOCKET
 */

const socket = new WebSocket(generateWSServerURL(), "ticker");
socket.onopen = requestUpdate;
socket.onerror = function(err) {
    console.log(err); //////////////////
};
socket.onmessage = function(message) {
    handleMessage(message.data);
};

function generateWSServerURL() {
    const loc = window.location;
    let output;
    output = (loc.protocol == "https:") ? "wss:" : "ws:";
    output += "//" + loc.host;
    return output;
}

function requestUpdate() {
    const payload = {
	action: "update"
    };
    socket.send(JSON.stringify(payload));
}

function sendAddSymbol() {
    const payload = {
	action: "add",
	symbol: $("add-symbol-field").value
    };
    socket.send(JSON.stringify(payload));
}

function sendDeleteSymbol(symbol) {
    const payload = {
	action: "delete",
	symbol: symbol
    };
    socket.send(JSON.stringify(payload));
}

function handleMessage(message) {
    message = JSON.parse(message);
    if (message.action == "add") {
	addNewStock(message.symbol);
    } else if (message.action == "delete") {
	removeLocalStock(message.symbol);
    } else if (message.action == "update") {
	updateStockList(message.list);
    }
}

/* STOCK LIST MANIPULATION
 */

function addNewStock(symbol) {
    if (globalStocksList.indexOf(symbol) == -1) {
	getFromApi(symbol, function(err, data) {
	    if (err) {
		console.log(err); ////
	    } else {
		globalStocksList.push(symbol);
		let box = new SymbolBox(symbol);
		$("symbols-container").insertBefore(box.drawBox(),
						    $("new-symbol-box"));
	    }
	});
    }
}

function getFromApi(symbol, cb) {
    let xhr = new XMLHttpRequest();
    xhr.addEventListener("load", () => cb(null, xhr.responseText));
    xhr.addEventListener("error", cb);
    xhr.addEventListener("abort", cb);
    xhr.open("GET", `/api?symbol=${symbol}`);
    xhr.send(null);
}

function removeLocalStock(symbol) {
    $(symbol).remove();
    deleteStockFromList(symbol);
}

function deleteStockFromList(symbol) {
    const index = globalStocksList.indexOf(symbol);
    if (index > -1) {
	globalStocksList.splice(index, 1);
	deleteStockFromList(symbol);
    }
}

function updateStockList(newList) {
    newList.forEach(function(symbol) {
	addNewStock(symbol);
    });
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
	let div = this.createContainer();
	div.setAttribute("id", symbol);
	div.setAttribute("class", "symbol-box");
	div.appendChild(drawInfo());
	div.appendChild(drawClose());
	return div;
    };

    function drawInfo() {
	let span = document.createElement("span");
	span.textContent = symbol;
	return span;
    }

    function drawClose() {
	let span = document.createElement("span");
	span.innerHTML = "&times;";
	span.onclick = deleteSymbol.bind(this);
	return span;
    }

    function deleteSymbol() {
	sendDeleteSymbol(symbol);
    }
}
SymbolBox.prototype = new DisplayBox();

function AddFormBox() {
    this.drawBox = function() {
	let div = this.createContainer();
	div.setAttribute("id", "new-symbol-box");
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
AddFormBox.prototype = new DisplayBox();

