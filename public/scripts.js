const $ = document.getElementById.bind(document);
let globalStocksList = [];

window.addEventListener("DOMContentLoaded", setup);

function setup() {
    const addSymbolBox = new AddFormBox();
    $("symbols-container").appendChild(addSymbolBox.drawBox());
    window.graph = new Graph();
    graph.draw();
}

/* WEBSOCKET
 */

const socket = new WebSocket(generateWSServerURL(), "ticker");
socket.onopen = requestUpdate;
socket.onerror = function(err) {
    console.log(err); //////////////////
};
socket.onmessage = function(message) {
    handleMessage(message.data);
};

function generateWSServerURL() {
    const loc = window.location;
    let output;
    output = (loc.protocol == "https:") ? "wss:" : "ws:";
    output += "//" + loc.host;
    return output;
}

function requestUpdate() {
    const payload = {
	action: "update"
    };
    socket.send(JSON.stringify(payload));
}

function sendAddSymbol() {
    const payload = {
	action: "add",
	symbol: $("add-symbol-field").value.toUpperCase()
    };
    socket.send(JSON.stringify(payload));
    $("add-symbol-field").value = "";
}

function sendDeleteSymbol(symbol) {
    const payload = {
	action: "delete",
	symbol: symbol
    };
    socket.send(JSON.stringify(payload));
}

function handleMessage(message) {
    message = JSON.parse(message);
    if (message.action == "add") {
	addNewStock(message.symbol);
    } else if (message.action == "delete") {
	removeLocalStock(message.symbol);
    } else if (message.action == "update") {
	updateStockList(message.list);
    }
}

/* STOCK LIST MANIPULATION
 */

function addNewStock(symbol) {
    if (globalStocksList.indexOf(symbol) == -1) {
	getFromApi(symbol, function(err, data) {
	    if (err) {
		console.log(err); ////
	    } else {
		window.graph.addData(JSON.parse(data));
		globalStocksList.push(symbol);
		let box = new SymbolBox(symbol);
		$("symbols-container").insertBefore(box.drawBox(),
						    $("new-symbol-box"));
	    }
	});
    }
}

function getFromApi(symbol, cb) {
    let xhr = new XMLHttpRequest();
    xhr.addEventListener("load", () => cb(null, xhr.responseText));
    xhr.addEventListener("error", cb);
    xhr.addEventListener("abort", cb);
    xhr.open("GET", `/api?symbol=${symbol}`);
    xhr.send(null);
}

function removeLocalStock(symbol) {
    window.graph.removeData(symbol);
    $(symbol).remove();
    deleteStockFromList(symbol);
}

function deleteStockFromList(symbol) {
    const index = globalStocksList.indexOf(symbol);
    if (index > -1) {
	globalStocksList.splice(index, 1);
	deleteStockFromList(symbol);
    }
}

function updateStockList(newList) {
    newList.forEach(function(symbol) {
	addNewStock(symbol);
    });
}

/* DISPLAY
 */

function DisplayBox() {
    this.createContainer = function() {
	let div = document.createElement("div");
	div.setAttribute("class", "display-box");
	return div;
    }
}

function SymbolBox(symbol) {
    this.drawBox = function() {
	let div = this.createContainer();
	div.setAttribute("id", symbol);
	div.setAttribute("class", "symbol-box");
	div.appendChild(drawInfo());
	div.appendChild(drawClose());
	return div;
    };

    function drawInfo() {
	let span = document.createElement("span");
	span.textContent = symbol;
	return span;
    }

    function drawClose() {
	let span = document.createElement("span");
	span.innerHTML = "&times;";
	span.onclick = deleteSymbol.bind(this);
	return span;
    }

    function deleteSymbol() {
	sendDeleteSymbol(symbol);
    }
}
SymbolBox.prototype = new DisplayBox();

function AddFormBox() {
    this.drawBox = function() {
	let div = this.createContainer();
	div.setAttribute("id", "new-symbol-box");
	div.appendChild(drawForm());
	return div;
    };

    function drawForm() {
	let form = document.createElement("form");
	form.setAttribute("action", "javascript:void(0)");

	let textInput = document.createElement("input");
	textInput.setAttribute("type", "text");
	textInput.setAttribute("id", "add-symbol-field");
	textInput.setAttribute("placeholder", "Symbol");

	let submitButton = document.createElement("button");
	submitButton.setAttribute("id", "submit-new-button");
	submitButton.textContent = "Add Ticker";
	submitButton.onclick = sendAddSymbol;

	form.appendChild(textInput);
	form.appendChild(submitButton);

	return form;
    }
}
AddFormBox.prototype = new DisplayBox();

/* GRAPH
 */ 

function Graph() {
    let data = [];
    
    this.draw = function() {
	d3.selectAll("svg > *").remove();
	let svg = d3.select("svg");
	const margin = {
	    left: 30,
	    bottom: 30,
	    right: 30,
	    top: 30
	};
	const width = svg.attr("width") - margin.left - margin.right,
	      height = svg.attr("height") - margin.top - margin.bottom;
	
	const chart = svg.append("g")
	      .attr("transform", `translate(${margin.left},${margin.top})`);

	const parseDate = d3.timeParse("%Y-%m-%d");

	const x = d3.scaleTime()
	      .domain([
		  d3.min(data, function(stock) {
		      return d3.min(stock, (d) => parseDate(d.Date));
		  }),
		  d3.max(data, function(stock) {
		      return d3.max(stock, (d) => parseDate(d.Date));
		  })
	      ])
	      .range([0, width]);
	const y = d3.scaleLinear()
	      .domain([d3.max(data, function(stock) {
		  return d3.max(stock, (d) => +d.Adj_Close);
	      }), 0])
	      .range([0, height]);
	const z = d3.scaleOrdinal(d3.schemeCategory10)
	      .domain(data.map(function(stock) {
		  return stock.map((d) => d.Symbol)
	      }));

	const line = d3.line()
	      .curve(d3.curveBasis)
	      .x((d) => x(parseDate(d.Date)))
	      .y((d) => y(d.Adj_Close));

	chart.append("g")
	    .attr("class", "x-axis axis")
	    .attr("transform", `translate(0,${height})`)
	    .call(d3.axisBottom(x));

	chart.append("g")
	    .attr("class", "y-axis axis")
	    .call(d3.axisLeft(y));
	
	let node = chart.selectAll(".node")
	    .data(data)
	    .enter().append("g")
	    .attr("class", "node");

	node.append("path")
	    .attr("class", "line")
	    .attr("d", (d) => line(d))
	    .style("stroke", (d) => z(d.Symbol))
	    .style("fill", "none");
    };

    this.addData = function(stockData) {
	data.push(stockData);
	this.draw();
    };

    this.removeData = function(symbol) {
	const index = indexOfSymbol(symbol);
	if (index > -1) {
	    data.splice(index, 1);
	    this.draw();
	}
    };

    function indexOfSymbol(symbol) {
	for (let i = 0; i < data.length; i++) {
	    if (data[i][0].Symbol == symbol) {
		return i;
	    }
	}
	return -1;
    }
}
