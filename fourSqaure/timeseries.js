/*
 * These are constants for some of the common layout parts of the timeseries.  Not all values have constants,
 * the tick marks for example have some values which are not kept as constants here
 */
var _TIMESERIES_WIDTH = 610;
var _TIMESERIES_HEIGHT = 110;
var _TIMESERIES_WIDTH_ADJUST = 7/8;
var _TIMESERIES_GRAPH_WIDTH = Math.floor(_TIMESERIES_WIDTH * _TIMESERIES_WIDTH_ADJUST); // take the width of the graph less some padding for margins and y-axis labels
var _TIMESERIES_SIDE_PADDING = 10;
var _TIMESERIES_COLOR_BACKGROUND = "rgb(80,80,80)";
var _TIMESERIES_COLOR_SELECTION = "rgb(60,60,60)";
var _TIMESERIES_COLOR_AXIS = "rgba(170,170,170,0.6)";
var _TIMESERIES_PIXELS_PER_POINT = 2;

// CONSTRUCTORS
/*
 * This class is used to draw sequential data onto the timeseries canvas.
 */
function Timeseries(div, typeColors){
    //canvas related state
    this.div = div;
    this.div.css("background", _TIMESERIES_COLOR_BACKGROUND);
    this.mode = "zoom";
    this.modeTip = undefined;
    this._setupModeTip();
    this.resize(false);
    
    //track the data
    this.typeColors = typeColors;
    this.data = {};
    // this.typeList = typeList;
    this.typeList = ["an artifact of drawing two datasets"];
    for (var i = 0; i < this.typeList.length; i++){
        this.data[this.typeList[i]] = undefined;
    }
    
    //track what and how we're drawing
    this.binRange = { min: 0, max: 0 };
    this.viewRange = { start: -1, end: -1, startMilli: 0, endMilli:0 };
    this.selectRange = { startMilli: -1, endMilli: -1 }; //-1 is off the left edge of the graph
    this.updateTimeBinRange();

    //track our resolution
    this.maxStep = 1;
    this.stepSize = 1;
    this.nextStepSize = 1;

    //do the initial draw
    this._start();
}

/*
 * Called at the end of the constructor, gets the current time bin range and then sends
 * a query and draws
 */
Timeseries.prototype._start = function(){
    var that = this;
    var ready = function(){
        if (that.viewRange.start !== -1 && that.viewRange.start !== -1){
            clearInterval(interval);
            that.update(true);
            that._addSelectionListeners();
        }
    }
    var interval = setInterval(ready, 30);
}

/*
 * Add listeners for selections and unselections on the chart
 */
Timeseries.prototype._addSelectionListeners = function(){
    var that = this;
    
    //if something has been drawn
    this.div.bind("plotselected", function(event, ranges) {
        var startMilli = Math.floor(ranges.xaxis.from);
        var endMilli = Math.floor(ranges.xaxis.to);
        var startBin = nanocube.to_tbin(new Date(startMilli));
        var endBin = nanocube.to_tbin(new Date(endMilli));
        
        if (that.mode === "zoom"){
            that.viewRange.startMilli = startMilli;
            that.viewRange.endMilli = endMilli;
            that.viewRange.start = clamp(nanocube.to_tbin(new Date(startMilli)), that.binRange.min, that.binRange.max);
            that.viewRange.end = clamp(nanocube.to_tbin(new Date(endMilli)), that.binRange.min, that.binRange.max);
            that.draw();
            that.update();
        } else if (that.mode === "select") {
            constrainer.setTime(startBin, endBin);
            that.selectRange.startMilli = startMilli;
            that.selectRange.endMilli = endMilli;
            that.draw();
        }
    });
    
    //if the selection has been cleared away
    this.div.bind("plotunselected", function (event) {
        if (that.mode === "zoom"){
            that.viewRange.startMilli = null;
            that.viewRange.endMilli = null;
            that.viewRange.start = that.binRange.min;
            that.viewRange.end = that.binRange.max;
            that.draw();
            that.update();
        } else if (that.mode === "select"){
            constrainer.clearTime();
            that.selectRange.startMilli = -1;
            that.selectRange.endMilli = -1;
            that.draw();
        }
    });
}


// DRAWING FUNCTIONS
/*
 * Draw the data onto the timeseries
 */
Timeseries.prototype.draw = function(){
    //pull the data out into lists by type - only use data in our view +/- a step to get the lines to show up - one point doesn't get drawn as a line
    var plotData = [];
    var rawData = [];
    var typeData = [];
    for (var t = 0; t < this.typeList.length; t++){
        rawData = this.data[this.typeList[t]];
        typeData = [];
        for (var i = 0; i < rawData.length; i++){
            if (rawData[i].bin >= (this.viewRange.start - this.stepSize) && rawData[i].bin <= (this.viewRange.end + this.stepSize)){ //add extra stepsize to keep from having empty space on the edge of the graph
                typeData.push([nanocube.from_tbin(rawData[i].bin).getTime(), rawData[i].count]);
            }
        }
        plotData.push(typeData);
    }

    //set the options for how we want the chart to draw
    var plotOptions = {
        xaxis: { 
            mode: "time", 
            font: { color: _TIMESERIES_COLOR_AXIS },
            min: this.viewRange.startMilli,
            max: this.viewRange.endMilli,
        },
        yaxis : { font:{ color: _TIMESERIES_COLOR_AXIS } }, 
        series: {
            lines: { show:true },
            points: { show:false },
            shadowSize: 0,
        },
        grid: { 
            color: _TIMESERIES_COLOR_AXIS,
            markings: [{
                color: _TIMESERIES_COLOR_SELECTION,
                xaxis: { from: this.selectRange.startMilli, to:this.selectRange.endMilli }
            }],
        },
        colors: this.typeColors,
        selection: { mode: "x" },
    };
    
    //plot the data
    $.plot(this.div, plotData, plotOptions);
}


// STATE FUNCTIONS
/*
 * Sorts data from a timeseries query into chronological order
 */
Timeseries._sortData = function(data, startBin, stepSize, numSteps){
    var result = undefined;
    if (data !== undefined) {
        //convert the results of the query to objects with an hour number and count
        result = _.map(data, function(count, i) {
            var tempBin = (parseInt(count.addr, 16) >> 32) & 0xFFFFFFFF; //bin is [a, b), calculating b, but it doesn't matter
            return { bin: (tempBin - 1),
                     count: count.value,
                   };
        });
        
        //we have to sort the list of times for it to draw properly
        result = result.sort(function(a, b){
            var aT = a.bin;
            var bT = b.bin;
            if (aT < bT){
                return -1;
            } else if (aT > bT){
                return 1;
            } else {
                return 0;
s            }
        });
        
        //make sure it is the full length
        if (result.length !== numSteps){
            for (var i = 0; i < numSteps; i++){
                if (result[i] === undefined || result[i].time !== (startBin + (i * stepSize))){
                    result.splice(i, 0, {time: (startBin + (i * stepSize)), count:0});
                }
            }
        }
        
    //else just create an appropriately long list of empty data
    } else {
        result = [];
        for (var i = startBin; i <= endBin; i++){
            result.push({time:startBin, count:0});
        }
    }
    
    return result;
}

/*
 * Turns on and off the log scaling for the timeseries, and redraws accordingly
 */
Timeseries.prototype.toggleLogScale = function(){
    alert("No longer supported!");
}

/*
 * Returns the number of steps based on the view range size, or 1 if the number is too small
 */
Timeseries.prototype._getStepCount = function(){
    var steps = Math.ceil((this.viewRange.end - this.viewRange.start) / this.nextStepSize);
    return (steps > 0) ? steps : 1;
}

/*
 * Sends a query to get the timeseries response, parses the response, and draws
 */
Timeseries.prototype.update = function(_force){
    var that = this;
    
    //set the size of the steps for the query
    this._checkStepSize(that.viewRange.start, that.viewRange.end)
    
    //create the time constraints for the query - add a little padding around what we actually ask for
    var when = { 
        // from: (this.viewRange.start > 0) ? this.viewRange.start - 1 : 0,
        from: this.viewRange.start,
        step: this.nextStepSize, 
        count: this._getStepCount() + 2,
    };
    
    //create the options
    var opts = { time : when,
                 region : constrainer.getTiles(),
                 where : constrainer.getCategories()
                };
    
    //run and send the query
    nanocube.time_series(opts, function(data, dataOpts){
        //Check that the options received match the current settings - don't load old data
        if (!that._verifyOptions(dataOpts)){
            return;
        }
    
        var sortedData = undefined;
        var index = 0;

        //if there is no data, then we need to create an empty object which will get filled later
        if (data === undefined){
            data = { root:{ children:[] } };
            // for (var t = 0; t < that.typeList.length; t++){
                // data.root.children.push({ children:[], addr:t });
            // }
        }

        //clear the current data
        for (var t = 0; t < that.typeList.length; t++){
            that.data[that.typeList[t]] = []
        }
        
        //loop over each of the categories for the data, sort that data, then store the sorted data
        // for (var i = 0; i < data.root.children.length; i++){
            sortedData = Timeseries._sortData(data.root.children, when.from, when.step, when.count);
            // index = parseInt(data.root.children[i].addr, 16);
            that.data[that.typeList[0]] = sortedData;
        // }

        //after processing all the data, store it
        that.stepSize = that.nextStepSize;
        that.draw();
    });
}

/*
 * Returns true if the time options match the stored values - good for checking that the data received is current
 */
Timeseries.prototype._verifyOptions = function(opts){
    var result = true;
    
    result = result && opts.time.from === this.viewRange.start;
    result = result && opts.time.step === this.nextStepSize; 
    result = result && opts.time.count === this._getStepCount() + 2;
    
    return result;
}

/*
 * Sends a query to get the start and end of the range of the time bins, sets values in Updater and Timeseries
 * WARNING - Failing to call this periodically will ruin the streaming capabilities and could crash things
 */
Timeseries.prototype.updateTimeBinRange = function(){
    var that = this;
    $.getJSON(nanocube.url + "/tquery", function(json){
        //compute the bins from the addresses
        var addr = json.root.children[0].addr;
        addr = addr.toString();
        var start = addr.substring(0,addr.length-8);
        var end = addr.substring(addr.length-8,addr.length);
        start = parseInt(start,16);
        end = parseInt(end,16);

        //make sure that we get numbers, otherwise store as 0
        if (isNaN(start)) start=0;
        if (isNaN(end)) end=0;

        //store the values
        that.binRange.min = start;
        that.binRange.max = end;
        
        //update our start and end bin too
        if (that.viewRange.start === -1 && that.viewRange.end === -1){
            that.viewRange.start = start;
            that.viewRange.end = end;
            that.viewRange.startMilli = null;
            that.viewRange.endMilli = null;
        }
        
        //update the sizing
        that._updateStepSize();
    });
}

/*
 * Updates the stored and next step sizes
 */
Timeseries.prototype._updateStepSize = function(){
    var numBins = this.binRange.max - this.binRange.min;
    var numPoints = Math.ceil(_TIMESERIES_GRAPH_WIDTH / _TIMESERIES_PIXELS_PER_POINT);
    
    if (numBins > numPoints){
        this.stepSize = (numBins / numPoints) | 0;
        this,maxStep = this.stepSize;
        this.nextStepSize = this.stepSize;
    } else {
        this.stepSize = 1;
        this.maxStep = 1;
        this.nextStepSize = 1;
    }
}

/*
 * Checks that the step size of the stored data matches that of the level of zoom, and updates otherwise
 */
Timeseries.prototype._checkStepSize = function(newStart, newEnd){
    var numPoints = Math.ceil(_TIMESERIES_GRAPH_WIDTH / _TIMESERIES_PIXELS_PER_POINT);
    var tempStep = Math.floor((newEnd - newStart) / numPoints);
    tempStep = (tempStep !== 0) ? tempStep : 1; //if its 0 that isn't allowed
    if (tempStep !== this.stepSize){
        this.nextStepSize = tempStep;
        return true;
    } else {
        return false;
    }
}

/*
 * Switch between different timeseries modes
 */
Timeseries.prototype.toggleMode = function(){
    if (this.mode === "zoom"){
        this.mode = "select";
    } else if (this.mode === "select"){
        this.mode = "zoom";
    }
    this.modeTip.text(this.mode.toUpperCase());
}

/*
 * Create a div where we display what the current mode is
 */
Timeseries.prototype._setupModeTip = function(){
    var modeTip = $(document.createElement("div"));
    modeTip.css("position", "absolute");
    modeTip.css("font-family", "Arial");
    modeTip.css("font-size", "75%");
    modeTip.css("color", "white");
    modeTip.text(this.mode.toUpperCase());
    this.div.before(modeTip);
    this.modeTip = modeTip;
}


// SIZING FUNCTIONS
/*
 * Resets the sizing for the Timeseries to take up the entire window.
 * @param _redraw - If this is anything other than undefined this will not redraw, external calls should just use "resize()".
 */
Timeseries.prototype.resize = function(_redraw){
    //calculate the new width
    var width = $(window).width() - (2 * _TIMESERIES_SIDE_PADDING);
    
    //move the canvas to match the current settings
    this.div.css("width", width + "px");
    this.div.css("height", _TIMESERIES_HEIGHT + "px");
    this.div.css("left", _TIMESERIES_SIDE_PADDING + "px");
    this.div.css("bottom", (2 * _TIMESERIES_SIDE_PADDING) + "px");
    
    this.modeTip.css("left", _TIMESERIES_SIDE_PADDING + "px");
    this.modeTip.css("bottom", (2 * _TIMESERIES_SIDE_PADDING + _TIMESERIES_HEIGHT) + "px");
    
    //adjust the draw width
    _TIMESERIES_WIDTH = width;
    _TIMESERIES_GRAPH_WIDTH = Math.floor(_TIMESERIES_WIDTH * _TIMESERIES_WIDTH_ADJUST);

    //now redraw
    if (_redraw === undefined){
        this.draw();
    }
}
