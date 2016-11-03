#!/usr/bin/env node

const env = process.env.NODE_ENV || "development",
      http = require("http"),
      router = require("./routes/router"),
      config = require("./config")[env],
      socket = require("./socket");

const server = http.createServer(router.handleRequest);

server.listen(config.port);

socket.createWSServer(server);

