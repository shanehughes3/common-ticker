"use strict"

const React = require("react"),
    ReactDOM = require("react-dom");

const $ = document.getElementById.bind(document);

/* WEBSOCKET
 */
class WSConnection {

    constructor() {
        this.socket = new WebSocket(this.generateWSServerURL(), "ticker");
        this.socket.onopen = this.requestUpdate.bind(this);
    }

    set onError(errFunction) {
	this.socket.onerror = () =>
	    errFunction("Error connecting to server - try refreshing the page");
	this.socket.onclose = () =>
	    errFunction("Connection to server lost - try refreshing the page");
    }

    set onMessage(msgFunction) {
	this.socket.onmessage = (message) => msgFunction(message.data);
    }

    get ready() {
	return this.socket.readyState === 1; // true on OPEN
    }

    generateWSServerURL() {
        const loc = window.location;
        let output;
        output = (loc.protocol == "https:") ? "wss:" : "ws:";
        output += "//" + loc.host;
        return output;
    }

    requestUpdate() {
        const payload = {
            action: "update"
        };
        this.socket.send(JSON.stringify(payload));
    }

    sendAddSymbol(symbol) {
        const payload = {
            action: "add",
            symbol: symbol.toUpperCase()
        };
        this.socket.send(JSON.stringify(payload));
    }

    sendDeleteSymbol(symbol) {
        const payload = {
            action: "delete",
            symbol: symbol
        };
        this.socket.send(JSON.stringify(payload));
    }

    handleMessage(message) {
        message = JSON.parse(message);
	this.callback(message);
    }
    
}

/* STOCK DATA API
 */ 

class StockDataApi {
    static req(symbol, cb) {
	let xhr = new XMLHttpRequest();
	xhr.addEventListener("load", () => cb(null, xhr.responseText));
	xhr.addEventListener("error", cb);
	xhr.addEventListener("abort", cb);
	xhr.open("GET", `/api?symbol=${symbol}`);
	xhr.send(null);
    }
}

/* DISPLAY
 */

class App extends React.Component {
    constructor() {
        super();
	this.handleMessage = this.handleMessage.bind(this);
	this.handleDeleteClick = this.handleDeleteClick.bind(this);
	this.handleAddFormSubmission = this.handleAddFormSubmission.bind(this);
	this.getStockColor = this.getStockColor.bind(this);
	this.displayError = this.displayError.bind(this);
	this.closeError = this.closeError.bind(this);
	this.setTimeSpan = this.setTimeSpan.bind(this);
	
        this.connection = new WSConnection(this.handleMessage);
	this.connection.onError = this.displayError.bind(this);
	this.connection.onMessage = this.handleMessage.bind(this);
	this.state = {
	    stockList: [],
	    error: null,
	    timeSpan: "1y"
	}
	this.colorDomain = d3.scaleOrdinal(d3.schemeCategory10)
			     .domain(this.state.stockList.map((d) => d.symbol));
    }

    componentDidUpdate() {
	this.colorDomain = d3.scaleOrdinal(d3.schemeCategory10)
			     .domain(this.state.stockList.map((d) => d.symbol));
    }
        
    handleMessage(message) {
	message = JSON.parse(message);
        if (message.action == "add") {
            this.addNewStock(message.symbol);
        } else if (message.action == "delete") {
            this.removeLocalStock(message.symbol);
        } else if (message.action == "update") {
            this.updateStockList(message.list);
        } else if (message.error) {
            this.displayError(message.error);
        }
    }

    addNewStock(symbol) {
	if (this.state.stockList.findIndex((d) =>      // prevent duplicates
	    d.symbol == symbol) == -1) {
	    StockDataApi.req(symbol, (err, data) => {
		if (err) {
		    this.displayError(`Could not get data for ${symbol}`);
		} else {
		    data = JSON.parse(data)
		    let stockList = this.state.stockList.slice();
		    stockList.push({
			symbol: symbol,
			history: data.history,
			info: data.info
		    });
		    this.setState({
			stockList: stockList
		    });
		}
	    });
	}
    }

    removeLocalStock(symbol) {
	const stockList = this.state.stockList.slice();
	const index = stockList.findIndex((d) => d.symbol == symbol);
	stockList.splice(index, 1);
	this.setState({
	    stockList: stockList
	});
    }

    updateStockList(list) {
	list.forEach((symbol) => this.addNewStock(symbol));
    }

    handleAddFormSubmission(symbol) {
	if (this.connection.ready) {
	    this.connection.sendAddSymbol(symbol);
	} else {
	    this.displayError(`Could not add ${symbol} - connection lost`);
	}
    }

    handleDeleteClick(symbol) {
	if (this.connection.ready) {
	    this.connection.sendDeleteSymbol(symbol);
	} else {
	    this.displayError(`Could not delete ${symbol} - connection lost`);
	}
    }

    displayError(err) {
	this.setState({ error: err });
    }

    closeError() {
	this.setState({ error: null });
    }

    getStockColor(symbol) {
	return this.colorDomain(symbol);
    }

    setTimeSpan(selection) {
	this.setState({
	    timeSpan: selection
	});
	console.log(selection, this.state.timeSpan); //////////////////
    }

    render() {
	const symbolBoxes = this.state.stockList.map((stock) =>
	    <SymbolBox stock={stock} key={stock.symbol}
		       handleClick={this.handleDeleteClick}
		       color={this.getStockColor(stock.symbol)} />
	);
        return (
            <div>
		<GraphSettings setSpan={this.setTimeSpan}
			       current={this.state.timeSpan}/>
                <GraphContainer stocks={this.state.stockList}
				getStockColor={this.getStockColor}
				timeSpan={this.state.timeSpan}/>
                <AddForm handleClick={this.handleAddFormSubmission} />
                <div id="symbols-container">
                    {symbolBoxes}
                </div>
		<ErrorDialog error={this.state.error} close={this.closeError} />
            </div>
        )
    }
}

function GraphSettings(props) {
    const options = ["1y", "6m", "3m", "1m", "1w"];
    const buttons = options.map((option) => {
	const className = (props.current == option) ?
			  "graph-span-selected" : "graph-span-button";
	return (
	    <button onClick={() => props.setSpan(option)}
		    className={className} key={option}>
		{option}
	    </button>
	);
    });
    return (
	<div className="graph-span-button-container">
	    {buttons}
	</div>
    );
}

class AddForm extends React.Component {
    constructor(props) {
        super(props);
	this.handleClick = this.handleClick.bind(this);
	this.handleChange = this.handleChange.bind(this);
	this.state = {
	    symbol: "",
	    requestTimeout: false
	}
    }
    handleClick() {
	if (this.state.requestTimeout == false &&
	    this.state.symbol.length > 0) {
	    this.props.handleClick(this.state.symbol);
	    this.setState({
		requestTimeout: true,
		symbol: ""
	    });
	    setTimeout(() => this.setState({ requestTimeout: false }), 2000);
	}
    }
    handleChange(e) {
	this.setState({
	    symbol: e.target.value
	});
    }
    render() {
        return (
            <div id="new-symbol-box">
                <form action="javascript:void(0)">
                    <input type="text" id="add-symbol-field"
			   placeholder="Symbol" value={this.state.symbol}
			   onChange={this.handleChange}/>
                    <button id="submit-new-button" onClick={this.handleClick}>
			{(this.state.requestTimeout) ?
			 "Adding..." : "Add Ticker"}
		    </button>
                </form>
            </div>
        );
    }
}

class SymbolBox extends React.Component {
    constructor(props) {
	super(props);
	this.handleClick = this.handleClick.bind(this);
    }
    handleClick() {
	this.props.handleClick(this.props.stock.symbol);
    }
    render() {
	const stock = this.props.stock;
	return (
	    <div className="symbol-box">
		<span className="symbol-box-title"
		      style={{color: this.props.color}}>
		    {stock.symbol}
		</span>
		<span className="symbol-box-close" onClick={this.handleClick}>
		    &times;
		</span>
		<div className="symbol-company-name">
		    {stock.info.Name}
		</div>
	    </div>
	)
    }
}

class ErrorDialog extends React.Component {
    constructor(props) {
	super(props);
	this.handleDialogClick = this.handleDialogClick.bind(this);
    }
    handleDialogClick(e) { // close only when clicking outside the dialog
	if (e.target == $("modal-dialog")) {
	    this.props.close();
	}
    }
    render() {
	const styles = {};
	if (this.props.error) {
	    styles.opacity = 1;
	    styles.pointerEvents = "auto";
	} else {
	    styles.opacity = 0;
	    styles.pointerEvents = "none";
	}
	return (
	    <div id="modal-dialog" style={styles}
		 onClick={this.handleDialogClick}>
		<div onClick={void(0)}>
		    <div id="dialog-close-button" onClick={this.props.close}>
			&times;
		    </div>
		    <div id="dialog-message">{this.props.error}</div>
		</div>
	    </div>
	);
    }
}

/* GRAPH
 */


class Graph {
    constructor(element) {
	let svg = d3.select(element).append("svg")
	const margin = {
	    left: 50,
	    bottom: 30,
	    right: 50,
	    top: 30
	};
	svg.attr("id", "chart")
	   .attr("width", "100%")
	   .attr("height", "300px");
	this.width = $("chart").clientWidth - margin.left - margin.right;
	this.height = $("chart").clientHeight - margin.top - margin.bottom;

	this.chart = svg.append("g")
			 .attr("transform",
			       `translate(${margin.left},${margin.top})`);
    }

    update(stocks, colorFunc, timeSpan) {
	d3.selectAll("svg > g > *").remove();
	
	const parseDate = d3.timeParse("%Y-%m-%d");
	const minDate = parseDate(this.getStartDate(timeSpan));

	const today = new Date();
	const x = d3.scaleTime()
		    .domain([minDate,
			     parseDate(today.toISOString().slice(0, 10))
		    ])
		    .range([0, this.width]);
	
	const y = d3.scaleLinear() // finds max overall value of 2d array
		    .domain([d3.max(stocks, function(stock) {
			return d3.max(stock.history, (d) => +d.Adj_Close);
		    }), 0])
		    .range([0, this.height]);

	const div = d3.select("body").append("div")
		      .attr("class", "tooltip")
		      .style("opacity", 0);
	
	const line = d3.line()
		       .curve(d3.curveBasis)
		       .x((d) => x(parseDate(d.Date)))
		       .y((d) => y(d.Adj_Close));

	let data = JSON.parse(JSON.stringify(stocks)); // deep copy
	data = data.map((stock) => {
	    stock.history = stock.history.filter((day) => {
		return parseDate(day.Date) >= minDate;
	    });
	    return stock;
	});

	this.chart.append("g")
	     .attr("class", "x-axis axis")
	     .attr("transform", `translate(0,${this.height})`)
	     .call(d3.axisBottom(x));

	this.chart.append("g")
	     .attr("class", "y-axis axis")
	     .call(d3.axisLeft(y));
	
	let node = this.chart.selectAll(".node")
			.data(data)
			.enter().append("g")
			.attr("class", "node");

	node.append("path")
	    .attr("class", "line")
	    .attr("d", (d) => line(d.history))
	    .style("stroke", (d) => colorFunc(d.symbol))
	    .style("fill", "none");
    }

    getStartDate(timeSpan) {
	const output = new Date();
	const span = {
	    "1y": () => {output.setFullYear(output.getFullYear() - 1)},
	    "6m": () => output.setMonth(output.getMonth() - 6),
	    "3m": () => output.setMonth(output.getMonth() - 3),
	    "1m": () => output.setMonth(output.getMonth() - 1),
	    "1w": () => output.setDate(output.getDate() - 7)
	};
	(span[timeSpan])();
	return output.toISOString().slice(0, 10);
    }

}

class GraphContainer extends React.Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {
	this.graph = new Graph(ReactDOM.findDOMNode(this));
	this.graph.update(this.props.stocks, this.props.getStockColor,
			  this.props.timeSpan);
    }
    componentDidUpdate() {
	this.graph.update(this.props.stocks, this.props.getStockColor,
			  this.props.timeSpan);
    }
    render() {
	return <div></div>;
    }
}



/* SETUP
 */

window.addEventListener("DOMContentLoaded", setup);

function setup() {
    ReactDOM.render(
        <App />,
        $("container"));
}
