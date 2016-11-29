"use strict"

const React = require("react"),
      ReactDOM = require("react-dom");

const $ = document.getElementById.bind(document);

/* WEBSOCKET
 */
class WSConnection {
    
    constructor() {
	this.socket = new WebSocket(generateWSServerURL(), "ticker");
	this.socket.onopen = requestUpdate;
	this.socket.onerror = function(err) {
	    displayError("Error connecting to server - " +
			 "try refreshing the page"); ///////////////
	};
	this.socket.onmessage = function(message) {
	    handleMessage(message.data); //////////////
	};
    }

    generateWSServerURL() {
	const loc = window.location;
	let output;
	output = (loc.protocol == "https:") ? "wss:" : "ws:";
	output += "//" + loc.host;
	return output;
    }

    requestUpdate() {
	const payload = {
	    action: "update"
	};
	this.socket.send(JSON.stringify(payload));
    }

    sendAddSymbol() { ////////////////////// refactor with passed param
	if ($("add-symbol-field").value != "") {
	    const payload = {
		action: "add",
		symbol: $("add-symbol-field").value.toUpperCase()
	    };
	    this.socket.send(JSON.stringify(payload));
	    $("add-symbol-field").value = "";
	    temporarilyDisableAddButton(); /////////////
	}
    }

    sendDeleteSymbol(symbol) {
	const payload = {
	    action: "delete",
	    symbol: symbol
	};
	this.socket.send(JSON.stringify(payload));
    }

    handleMessage(message) {
	message = JSON.parse(message);
	if (message.action == "add") {
	    addNewStock(message.symbol);
	} else if (message.action == "delete") {
	    removeLocalStock(message.symbol);
	} else if (message.action == "update") {
	    updateStockList(message.list);
	} else if (message.error) {
	    displayError(message.error);
	}
    }

}

/* DISPLAY
 */

class App extends React.Component {
    constructor() {
	super();
	this.connection = new WSConnection();
	
    }

    render() {
	return (
		<div>
		<Graph />
		<Form />
		</div>
	)
    }
}

/* GRAPH
 */

class Graph extends React.Component {
    
}


/* SETUP
 */

window.addEventListener("DOMContentLoaded", setup);

function setup() {
    ReactDOM.render(
	    <App />,
	$("container"));
}
