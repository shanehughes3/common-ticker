const WebSocketServer = require("websocket").server,
      logger = require("./logger"),
      api = require("./api");

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
		handleMessage(message.utf8Data, connection);
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

function handleMessage(message, connection) {
    message = JSON.parse(message);
    if (message.verb == "add") {
	api.add(message.symbol, function(err) {
	    if (err) {
		connection.sendUTF(err);
	    } else {
		sendToAllConnected(sanitizeAndStringifyMessage(message));
	    }
	});
    } else if (message.verb == "delete") {
	api.delete(message.symbol, function(err) {
	    if (err) {
		connection.sendUTF(JSON.stringify(err));
	    } else {
		sendToAllConnected(sanitizeAndStringifyMessage(message));
	    }
	});
    } else {
	console.log(`the message: ${message}`); /////////////
    }
    
}

function sendToAllConnected(payload) {
    allConnections.forEach(function(connection) {
	connection.sendUTF(payload);
    });
}

function sanitizeAndStringifyMessage(message) {
    const cleanMessage = {
	verb: message.verb,
	symbol: message.symbol
    };
    return JSON.stringify(cleanMessage);
}
