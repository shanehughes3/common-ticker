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
    return true;
}

function removeConnection(connection) {
    let index = allConnections.indexOf(connection);
    if (index > -1) {
	allConnections.splice(index, 1);
	removeConnection(connection);
    }    
}

const messageActions = {
    add: addSymbol,
    delete: deleteSymbol,
    update: updateClient
};

function handleMessage(message, connection) {
    message = JSON.parse(message);
    if (messageActions.hasOwnProperty(message.action)) {
	messageActions[message.action](message, connection);
    }
}

function addSymbol(message, connection) {
    api.add(message.symbol, function(err) {
	if (err) {
	    connection.sendUTF(packError(err));
	} else {
	    sendToAllConnected(sanitizeAndStringifyMessage(message));
	}
    });
}

function deleteSymbol(message, connection) {
    api.delete(message.symbol, function(err) {
	if (err) {
	    connection.sendUTF(packError(err));
	} else {
	    sendToAllConnected(sanitizeAndStringifyMessage(message));
	}
    });
}

function updateClient(message, connection) {
    api.update(function(err, symbolList) {
	if (err) {
	    connection.sendUTF(packError(err));
	} else {
	    const payload = {
		action: "update",
		list: symbolList
	    };
	    connection.sendUTF(JSON.stringify(payload));
	}
    });
}

function sendToAllConnected(payload) {
    allConnections.forEach(function(connection) {
	connection.sendUTF(payload);
    });
}

function sanitizeAndStringifyMessage(message) {
    const cleanMessage = {
	action: message.action,
	symbol: message.symbol
    };
    return JSON.stringify(cleanMessage);
}

function packError(err) {
    const output = {
	error: err.message || err
    };
    return JSON.stringify(output);
}
