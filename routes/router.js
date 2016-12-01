const express = require("express"),
      router = express.Router(),
      api = require("../api");

router.get("/api", function(req, res) {
    if (req.query.symbol) {
	api.getCacheData(req.query.symbol, function(err, data) {
	    if (err) {
		res.json(err);
	    } else if (data) {
		res.json(data);
	    } else {
		res.json({error: "NoResults"});
	    }
	});
    } else {
	res.json({error: "InvalidRequest"});
    }
});

module.exports = router;
