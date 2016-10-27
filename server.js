#!/usr/bin/env node

process.env.NODE_ENV = process.env.NODE_ENV || "development";

const env = process.env.NODE_ENV,
      http = require("http"),
      WebSocketServer = require("websocket").server,
      router = require("./routes/router"),
      logger = require("./logger"),
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
	logger.socketRequest(req, false);
	return;
    }

    const connection = req.accept("ticker", req.origin);
    logger.socketRequest(req, true);

    connection.on("message", function(message) {
	if (message.type === "utf8") {
	    console.log("Received: " + message.utf8Data);
	} else if (message.type === "binary") {
	    console.log(`Received message of ${message.binaryData.length} bytes`);
	}
    });

    connection.on("close", logger.socketClose.bind(connection));
});
