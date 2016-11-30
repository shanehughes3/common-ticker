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
	this.socket.onerror = errFunction;
    }

    set onMessage(msgFunction) {
	this.socket.onmessage = (message) => msgFunction(message.data);
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
	
        this.connection = new WSConnection(this.handleMessage);
	this.connection.onError = () => this.displayError(
	    "Error connecting to server - try refreshing the page");
	this.connection.onMessage = this.handleMessage.bind(this);
	this.state = {
	    stockList: [],
	    error: null
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
	this.connection.sendAddSymbol(symbol);
    }

    handleDeleteClick(symbol) {
	this.connection.sendDeleteSymbol(symbol);
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

    render() {
	const symbolBoxes = this.state.stockList.map((stock) =>
	    <SymbolBox stock={stock} key={stock.symbol}
		       handleClick={this.handleDeleteClick}
		       color={this.getStockColor(stock.symbol)} />
	);
        return (
            <div>
                <GraphContainer stocks={this.state.stockList}
				getStockColor={this.getStockColor}/>
                <AddForm handleClick={this.handleAddFormSubmission} />
                <div id="symbols-container">
                    {symbolBoxes}
                </div>
		<ErrorDialog error={this.state.error} close={this.closeError} />
            </div>
        )
    }
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
	if (this.state.requestTimeout == false) {
	    this.props.handleClick(this.state.symbol);
	    this.setState({ requestTimeout: true });
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
			   placeholder="symbol" value={this.state.symbol}
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

    update(stocks, colorFunc) {
	d3.selectAll("svg > g > *").remove();
	
	const parseDate = d3.timeParse("%Y-%m-%d");

	const x = d3.scaleTime()
		    .domain([  // stock data is 2D - finds min/max overall date
			d3.min(stocks, function(stock) {
			    return d3.min(stock.history, (d) =>
				parseDate(d.Date));
			}),
			d3.max(stocks, function(stock) {
			    return d3.max(stock.history, (d) =>
				parseDate(d.Date));
			})
		    ])
		    .range([0, this.width]);
	
	const y = d3.scaleLinear() // see above - finds max overall value
		    .domain([d3.max(stocks, function(stock) {
			return d3.max(stock.history, (d) => +d.Adj_Close);
		    }), 0])
		    .range([0, this.height]);
	
	const line = d3.line()
		       .curve(d3.curveBasis)
		       .x((d) => x(parseDate(d.Date)))
		       .y((d) => y(d.Adj_Close));

	this.chart.append("g")
	     .attr("class", "x-axis axis")
	     .attr("transform", `translate(0,${this.height})`)
	     .call(d3.axisBottom(x));

	this.chart.append("g")
	     .attr("class", "y-axis axis")
	     .call(d3.axisLeft(y));
	
	let node = this.chart.selectAll(".node")
			.data(stocks)
			.enter().append("g")
			.attr("class", "node");

	node.append("path")
	    .attr("class", "line")
	    .attr("d", (d) => line(d.history))
	    .style("stroke", (d) => colorFunc(d.symbol))
	    .style("fill", "none");

    }
}

class GraphContainer extends React.Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {
	this.graph = new Graph(ReactDOM.findDOMNode(this));
	this.graph.update(this.props.stocks, this.props.getStockColor);
    }
    componentDidUpdate() {
	this.graph.update(this.props.stocks, this.props.getStockColor);
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
