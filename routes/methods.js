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

exports.renderPublicFile = function(req, res) {
    const endpoint = url.parse(req.url).pathname;
    fs.readFile("./public" + endpoint, "utf8", function(err, file) {
	if (err) {
	    exports.render500(req, res);
	} else {
	    res.writeHead(200, {"Content-type": getMimeType(endpoint)});
	    res.end(file);
	}
    });    
};

function getMimeType(filename) {
    const extension = filename.split(".").slice(-1)[0];
    return mimeTypeList[extension];
}

const mimeTypeList = {
    js: "application/javascript",
    css: "text/css"
};

exports.render404 = function(req, res) {
    res.writeHead(404, {"Content-type": "text/plain"});
    res.end("404 Not Found\n");
};

exports.render500 = function(req, res) {
    res.writeHead(500, {"Content-type": "text/plain"});
    res.end("500 Internal Server Error");
};

exports.api = function(req, res) {

};
