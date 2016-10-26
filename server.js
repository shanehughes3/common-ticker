#!/usr/bin/env node

process.env.NODE_ENV = process.env.NODE_ENV || "development";

const env = process.env.NODE_ENV,
      http = require("http"),
      WebSocketServer = require("websocket").server,
      router = require("./routes/router"),
      config = require("./config")[env];

const server = http.createServer(router.handleRequest);

server.listen(config.port);



wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    return true;
}

wsServer.on("request", function(req) {
    if (!originIsAllowed(req.origin)) {
	req.reject();
	console.log((new Date()) + `Connection from ${req.origin} rejected`);
	return;
    }

    const connection = req.accept("test-protocol", req.origin);
    console.log((new Date()) + `Connection from ${req.origin} accepted`);

    connection.on("message", function(message) {
	if (message.type === "utf8") {
	    console.log("Received: " + message.utf8Data);
	} else if (message.type === "binary") {
	    console.log(`Received message of ${message.binaryData.length} bytes`);
	}
    });

    connection.on("close", function(reasonCode, description) {
	console.log((new Date()) + `${reasonCode} - ${connection.remoteAddress} disconnected - ${description}`);
    });
});
