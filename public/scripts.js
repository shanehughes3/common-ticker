const $ = document.getElementById.bind(document);
let globalStocksList = [];

window.addEventListener("DOMContentLoaded", setup);

function setup() {
    const addFormBox = new AddFormBox();
    $("add-form-container").appendChild(addFormBox.drawBox());
    window.graph = new Graph();
    window.graph.initialize();
    $("dialog-close-button").onclick = closeDialog;
    $("modal-dialog").onclick = function(event) {
	// close when clicking outside of the display window
	if (event.target == this) {
	    closeDialog();
	}
    };
}

/* WEBSOCKET
 */

const socket = new WebSocket(generateWSServerURL(), "ticker");
socket.onopen = requestUpdate;
socket.onerror = function(err) {
    displayError("Could not connect to server. Try refreshing the page.");
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
    if ($("add-symbol-field").value != "") {
	const payload = {
	    action: "add",
	    symbol: $("add-symbol-field").value.toUpperCase()
	};
	socket.send(JSON.stringify(payload));
	$("add-symbol-field").value = "";
	temporarilyDisableAddButton();
    }
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
    } else if (message.error) {
	displayError(message.error);
    }
}

function temporarilyDisableAddButton() {
    const button = $("submit-new-button");
    button.onclick = null;
    button.textContent = "Adding...";
    window.setTimeout(function() {
	button.onclick = sendAddSymbol;
	button.textContent = "Add Ticker";
    }, 2000);
}

/* STOCK LIST MANIPULATION
 */

function addNewStock(symbol) {
    if (globalStocksList.indexOf(symbol) == -1) {
	getFromApi(symbol, function(err, data) {
	    if (err) {
		displayError("Could not retrieve stock data.");
	    } else {
		data = JSON.parse(data);
		window.graph.addData(data.history);
		globalStocksList.push(symbol);
		let box = new SymbolBox(symbol, data.info);
		$("symbols-container").appendChild(box.drawBox());
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

function SymbolBox(symbol, info) {
    this.drawBox = function() {
	let div = this.createContainer();
	div.setAttribute("id", symbol);
	div.setAttribute("class", "symbol-box");
	div.appendChild(drawTitle());
	div.appendChild(drawClose());
	div.appendChild(drawInfo());
	return div;
    };

    function drawTitle() {
	let span = document.createElement("span");
	span.textContent = symbol;
	span.setAttribute("class", "symbol-box-title");
	span.style.color = window.graph.getStockColor(symbol);
	return span;
    }

    function drawClose() {
	let span = document.createElement("span");
	span.innerHTML = "&times;";
	span.onclick = deleteSymbol.bind(this);
	span.setAttribute("class", "symbol-box-close");
	return span;
    }

    function drawInfo(parentDiv) {
	let div = document.createElement("div");
	div.textContent = info.Name;
	div.setAttribute("class", "symbol-company-name");
	return div;
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

function updateSymbolBoxColors() {
    const elements = document.getElementsByClassName("symbol-box-title");
    for (let i = 0; i < elements.length; i++) {
	const symbol = elements[i].textContent;
	elements[i].style.color = window.graph.getStockColor(symbol);
    }
}

/* GRAPH
 */ 

function Graph() {
    const self = this;
    let data = [];
    
    function draw() {
	d3.selectAll("svg > *").remove();
	let svg = d3.select("svg");
	const margin = {
	    left: 50,
	    bottom: 30,
	    right: 50,
	    top: 30
	};
	const width = $("chart").clientWidth - margin.left - margin.right,
	      height = $("chart").clientHeight - margin.top - margin.bottom;

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
	self.getStockColor = d3.scaleOrdinal(d3.schemeCategory10)
	      .domain(data.map((d) => d[0].Symbol));

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
	    .style("stroke", (d) => self.getStockColor(d[0].Symbol))
	    .style("fill", "none");

	updateSymbolBoxColors();
    };

    this.initialize = function() {
	draw();
    }

    this.addData = function(stockData) {
	data.push(stockData);
	draw();
    };

    this.removeData = function(symbol) {
	const index = indexOfSymbol(symbol);
	if (index > -1) {
	    data.splice(index, 1);
	    draw();
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

/* MODAL DIALOG
 */

function displayError(error) {
    $("dialog-message").textContent = `Error: ${error}`;
    $("modal-dialog").style.opacity = 1;
    $("modal-dialog").style.pointerEvents = "auto";
}

function closeDialog() {
    $("modal-dialog").style.opacity = 0;
    $("modal-dialog").style.pointerEvents = "none";
}
