const NodeCache = require("node-cache"),
      ystocks = require("ystocks"),
      Api = ystocks();

cache = new NodeCache({
    stdTTL: 60 * 60 * 24,
    checkperiod: 60 * 60
});

exports.add = function(symbol, cb) {
    if (cache.get(symbol)) {
	let e = new Error("That symbol has already been added");
	e.name = "SymbolAlreadyAdded";
	cb(e);
    } else {
	Api.history(generateHistoryParams(symbol), function(err, data) {
	    if (err) {
		cb(err);
	    } else if (data) {
		cache.set(symbol, data);
		cb(null);
	    } else {
		let e = new Error("That stock symbol returned no results");
		e.name = "InvalidSymbol";
		cb(e);
	    }
	});
    }
};

exports.delete = function(symbol, cb) {
    if (cache.get(symbol)) {
	cache.delete(symbol);
	cb(null);
    } else {
	let e = new Error("That symbol has not been added");
	e.name = "SymbolNotAdded";
	cb(e);
    }
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
