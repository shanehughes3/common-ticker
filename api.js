const https = require("https");

module.exports = class {
    quote(symbols, cb) {
	if (!Array.isArray(symbols)) {
	    symbols = [symbols];
	}

	const options = {
	    hostname: "query.yahooapis.com",
	    path: generateStockPath(symbols),
	    method: "GET"
	};

	sendRequest(options, function(err, data) {
	    if (err) {
		cb(err);
	    } else if (data.query.results) {
		const results = data.query.results;
		cb(null, results.quote, removeResults(data));
	    } else {
		console.log("here");
		cb(null, data);
	    }
	}); 
    }
}

function generateStockPath(symbols) {
    output = "/v1/public/yql?format=json";
    output += "&env=store://datatables.org/alltableswithkeys";
    output += "&q=select * from yahoo.finance.quotes where symbol in (";
    symbols.forEach(function(symbol, index) {
	if (index > 0) {
	    output += ",";
	}
	output += "'" + symbol + "'";
    });
    output += ")";
    return encodeURI(output);
}

function sendRequest(options, internalCb) {
    const req = https.request(options, function(res) {
	let data = "";
	res.on("data", (d) => {data += d});
	res.on("end", function() {
	    data = JSON.parse(data);
	    internalCb(null, data);
	});
    });
    req.on("error", function(err) {
	internalCb(err);
    });
    req.end();
}

function removeResults(responseObject) {
    delete(responseObject.query.results);
    return responseObject;
}
