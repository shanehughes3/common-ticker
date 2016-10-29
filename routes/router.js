const url = require("url"),
      fs = require("fs"),
      methods = require("./methods"),
      logger = require("../logger.js");

exports.handleRequest = function(req, res) {
    logger.req(req, res);
    (HTTPMethods[req.method])(req, res);
};

const HTTPMethods = {
    "GET": function(req, res) {
	const endpoint = url.parse(req.url).pathname;
	if (routes.hasOwnProperty(endpoint)) {
	    routes[endpoint](req, res);
	} else if (fs.existsSync("./public" + endpoint)) {
	    methods.renderPublicFile(req, res);
	} else {
	    methods.render404(req, res);
	}
    },
    "POST": function(req, res) {

    }
};

const routes = {
    "/": methods.renderIndex,
    "/api": methods.api
};
    
