const url = require("url"),
      methods = require("./methods"),
      logger = require("../logger.js");

exports.handleRequest = function(req, res) {
    logger(req, res);
    (HTTPMethods[req.method])(req, res);
};

const HTTPMethods = {
    "GET": function(req, res) {
	const endpoint = url.parse(req.url).pathname;
	if (endpoint === "/") {
	    methods.renderIndex(req, res);
	} else {
	    methods.render404(req, res);
	}
    },
    "POST": function(req, res) {

    }
};
