#!/usr/bin/env node

const env = process.env.NODE_ENV || "development",
      router = require("./routes/router"),
      config = require("./config")[env],
      socket = require("./socket"),
      express = require("express"),
      app = express(),
      http = require("http"),
      scribe = require("express-scribe");

app.use(scribe({removeIPv4Prefix: true}));
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/views"));
app.use(router);

const server = http.createServer(app);
server.listen(config.port);

socket.createWSServer(server);

