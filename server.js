#!/usr/bin/env node

process.env.NODE_ENV = process.env.NODE_ENV || "development";

const env = process.env.NODE_ENV,
      http = require("http"),
      router = require("./routes/router"),
      config = require("./config")[env];

const server = http.createServer(router.handleRequest);

server.listen(config.port);

