const url = require("url"),
      fs = require("fs"),
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
	} else if (fs.existsSync("./public" + endpoint)) {
	    methods.renderPublicFile(req, res);
	} else {
	    methods.render404(req, res);
	}
    },
    "POST": function(req, res) {

    }
};
