const WebSocketServer = require("websocket").server,
      logger = require("./logger");

let allConnections = [];

exports.createWSServer = function(httpServer) {
    wsServer = new WebSocketServer({
	httpServer: httpServer,
	autoAcceptConnections: false
    });

    wsServer.on("request", function(req) {
	if (!originIsAllowed(req.origin)) {
	    req.reject();
	    logger.socketRequest(req, false);
	    return;
	}

	const connection = req.accept("ticker", req.origin);
	logger.socketRequest(req, true);
	allConnections.push(connection);
	
	connection.on("message", function(message) {
	    if (message.type === "utf8") {
		handleMessage(message.utf8Data);
	    }
	});

	connection.on("close", function() {
	    logger.socketClose(connection);
	    removeConnection(connection);
	});
    });
}

function originIsAllowed(origin) {
    return true; ///////////
}

function removeConnection(connection) {
    let index = allConnections.indexOf(connection);
    if (index > -1) {
	allConnections.splice(index, 1);
	removeConnection(connection);
    }
    
}

function handleMessage(message) {
    message = JSON.parse(message);
    if (message.verb == "add") {
	console.log(`add ${message.symbol}`); /////////////
	const outgoingMessage = {
	    verb: "add",
	    symbol: message.symbol
	};
	sendToAllConnected(JSON.stringify(outgoingMessage));
    } else {
	console.log(`the message: ${message}`); /////////////
    }
    
}

function sendToAllConnected(payload) {
    allConnections.forEach(function(connection) {
	connection.sendUTF(payload);
    });
}
