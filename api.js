const NodeCache = require("node-cache"),
      ystocks = require("ystocks"),
      Api = ystocks();

cache = new NodeCache({
    stdTTL: 60 * 60 * 24, // 24 hours
    checkperiod: 60 * 60  // 1 hour
});

exports.add = function(symbol, cb) {
    if (cache.get(symbol)) {
	let e = new Error("That symbol has already been added");
	e.name = "SymbolAlreadyAdded";
	cb(e);
    } else {
	let newSymbolObject = {};
	const historyRetrieval = new Promise(function(resolve, reject) {
	    Api.history(generateHistoryParams(symbol), function(err, data) {
		if (err) {
		    reject(err);
		} else if (data) {
		    newSymbolObject.history = data;
		    resolve();
		} else {
		    reject("InvalidSymbol");
		}
	    });
	});
	const metaRetrieval = new Promise(function(resolve, reject) {
	    Api.quote(symbol, function(err, data) {
		if (err) {
		    reject(err);
		} else if (data) {
		    newSymbolObject.info = data[0];
		    resolve();
		} else {
		    reject("InvalidSymbol");
		}
	    });
	});
	Promise.all([historyRetrieval, metaRetrieval])
	    .then(function() {
		cache.set(symbol, newSymbolObject);
		cb(null);
	    })
	    .catch(function(reason) {
		cb(reason);
	    });
    }
};

exports.delete = function(symbol, cb) {
    if (cache.get(symbol)) {
	cache.del(symbol);
	cb(null);
    } else {
	let e = new Error("That symbol has not been added");
	e.name = "SymbolNotAdded";
	cb(e);
    }
};

exports.getCacheData = function(symbol, cb) {
    cache.get(symbol, function(err, value) {
	cb(err, value);
    });
};

exports.update = function(cb) {
    cache.keys(function(err, outputList) {
	if (err) {
	    cb(err);
	} else {
	    cb(null, outputList);
	}
    });
};

function generateHistoryParams(symbol) {
    const today = new Date();
    let startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 1);
    return {
	symbol: symbol,
	start: startDate,
	end: today
    }
}

