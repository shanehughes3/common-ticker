const fs = require("fs"),
      url = require("url");

exports.renderIndex = function(req, res) {
    fs.readFile("./views/index.html", "utf8", function(err, file) {
	if (err) {
	    console.log(err);
	    exports.render500(req, res);
	} else {
	    res.writeHead(200, {"Content-type": "text/html"});
	    res.end(file);
	}
    });
};

exports.render404 = function(req, res) {
    res.writeHead(404, {"Content-type": "text/plain"});
    res.end("404 Not Found\n");
};

exports.render500 = function(req, res) {
    res.writeHead(500, {"Content-type": "text/plain"});
    res.end("500 Internal Server Error");
};

