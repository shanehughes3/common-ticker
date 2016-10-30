const fs = require("fs"),
      url = require("url"),
      querystring = require("querystring"),
      ystocks = require("../api"),
      Api = ystocks();


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

exports.api = function(req, res) {
    const query = querystring.parse(url.parse(req.url).query);
    res.writeHead(200, {"Content-type": "application/json"});
    if (query.symbol) {
	Api.quote(query.symbol, function(err, data) {
	    if (err) {
		res.end(err);
	    } else if (data) {
		res.end(JSON.stringify(data));
	    } else {
		res.end(JSON.stringify({error: "NoResults"}));
	    }
	});
    } else {
	res.end(JSON.stringify({error: "InvalidRequest"}));
    }
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
