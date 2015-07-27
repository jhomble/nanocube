var _HISTOGRAM_BAR_WIDTH = 170;
var _HISTOGRAM_PADDING = 1;
var _HISTOGRAM_BAR_HEIGHT = 18;
var _HISTOGRAM_MAX_WIDTH = 260

// CONSTRUCTORS
/*
 * Used to draw a histogram on the given canvas, using the given dimension name and labels,
 * and drawing the bars in the specified colors based on whether or not they have been selected
 */
function Histogram(canvas, dimName, tags, opt) {
    //store state for drawing
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    this.color = opt.color || "rgb(170,170,170)";
    this.selectedColor = opt.selectedColor || "rgb(210,210,210)";
    this.barWidth = _HISTOGRAM_BAR_WIDTH;

    //store state for querying and display
    this.dim = dimName;
    this.title = opt.title || dimName;
    this.ignoreList = ($.isArray(opt.ignoreList)) ? opt.ignoreList : [];
    this.tags = tags;
    this.labels = ($.isArray(opt.labels) && opt.labels.length === tags.length) ? opt.labels : tags;
    this.maxLabelWidth = 0;
    this._setDimensions();
    this.currentSelection = [];

    //update the data we currently have and draw it
    this.data = undefined;
    this.update();

    //add the listener for selecting a dimension
    var that = this;
    this.canvas.addEventListener("mousedown", function(ev) {
        that._mouseDown(ev);
    }, false);
    this.canvas.addEventListener('contextmenu', function(ev) {
        ev.preventDefault();
    }, false);
}


// INPUT HANDLING FUNCTIONS
/*
 * Handler for mouse clicks on the histogram
 */
Histogram.prototype._mouseDown = function(ev) {
    ev.preventDefault();

    //get the position of the click
    var pixelY = (ev.offsetY) ? ev.offsetY : (ev.clientY - this.canvas.offsetTop + $(window).scrollTop());

    //clamp the click just in case
    pixelY = clamp(pixelY, 0, this.canvas.height - 1);

    //calculate which bar was selected
    var selected = 0;
    while (pixelY >= _HISTOGRAM_BAR_HEIGHT) {
        selected++;
        pixelY -= _HISTOGRAM_BAR_HEIGHT;
    }
    selected--;//for the title

    //pass the selection to something depending on what button was clicked
    if (ev.button === 2 && selected !== -1) { //2 is for right, 0 and 1 are for left depending on browser
        this._processRightClick();
    } else if (selected !== -1) {
        this._updateSelected(selected);
    }
}

/*
 * Input handler for right clicks on the histogram
 */
Histogram.prototype._processRightClick = function() {
    //update the map
    if (this.currentSelection.length === 0) {
        this._selectAll();
    } else {
        this._clearSelected();
    }
    this.draw();
}


//DRAWING FUNCTIONS
/*
 * Clears the bars from the histogram and just draws the labels
 */
Histogram.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.ctx.fillStyle = "rgb(80,80,80)";
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
}

/*
 * Draws the bars on the histogram
 */
Histogram.prototype.draw = function() {
    //first clear the canvas
    this.clear();

    //draw the title
    this.ctx.font = "bold 11pt Arial";
    this.ctx.fillStyle = "rgb(210,210,210)";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";
    this.ctx.fillText(this.title, this.canvasWidth / 2, _HISTOGRAM_PADDING + 1);

    //draw the labels
    this.ctx.font = "9pt Arial";
    this.ctx.textAlign = "right";
    this.ctx.textBaseline = "top";
    for (var i = 0; i < this.tags.length; i++) {
        //check that we're not skippong this bar
        if ($.inArray(i, this.ignoreList) === -1) {

            //set the color
            if ($.inArray(i, this.currentSelection) !== -1) {
                this.ctx.fillStyle = this.selectedColor;
            } else {
                this.ctx.fillStyle = "rgb(170,170,170)";
            }

            //draw the label
            this.ctx.fillText(this.labels[i], this.maxLabelWidth + _HISTOGRAM_PADDING, _HISTOGRAM_PADDING + (_HISTOGRAM_BAR_HEIGHT * (i + 1)) + 1);
        }
    }

    //calculate the maximum value
    var max = 0;
    for (var i = 0; i < this.data.length; i++) {
        if ($.inArray(i, this.ignoreList) === -1) {
            max = (max < this.data[i]) ? this.data[i] : max;
        }
    }

    //draw the bars
    var startX = this.maxLabelWidth + (3 * _HISTOGRAM_PADDING); //two for space between bar and text, one for the edge
    var width = 0;
    for (var i = 0; i < this.tags.length; i++) {
        //check that we're not skippong this bar
        if ($.inArray(i, this.ignoreList) !== -1) {
            continue;
        }

        //set the color
        if ($.inArray(i, this.currentSelection) !== -1) {
            this.ctx.fillStyle = this.selectedColor;
        } else {
            this.ctx.fillStyle = this.color;
        }

        //draw the bar
        var width = (this.data[i] * (this.barWidth / max)) | 0;
        this.ctx.fillRect(startX, _HISTOGRAM_PADDING + (_HISTOGRAM_BAR_HEIGHT * (i + 1)), width, _HISTOGRAM_BAR_HEIGHT - (2 * _HISTOGRAM_PADDING)); //pad the top and bottom of the bar
    }

    //draw the text for the bars - the counts
    this.ctx.font = "9pt Arial";
    this.ctx.fillStyle = "rgb(0,0,0)";
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "top";
    for (var i = 0; i < this.tags.length; i++) {
        if ($.inArray(i, this.ignoreList) === -1) {
            this.ctx.fillText(addCommas(this.data[i].toString()), startX + _HISTOGRAM_PADDING, _HISTOGRAM_PADDING + (_HISTOGRAM_BAR_HEIGHT * (i + 1)) + 1);
        }
    }
}


// STATE FUNCTIONS
/*
 * Clear all selections
 */
Histogram.prototype._clearSelected = function() {
    this.currentSelection = [];
    constrainer.setCategory(this.dim, undefined);
    this.draw();
}

/*
 * sorts and stores the values based on what was returned
 * From the histograms in the original version of the viz, for parsing the response, which is a tree
 */
Histogram.prototype._newData = function(data) {
    //generate an empty result in case there is no data
    var result = []
    for (var i = 0; i < this.tags.length; i++) {
        result[i] = 0
    }

    //if there is data, parse and sort it
    if (data !== undefined) {
        var name = this.dim
        var level = data.root.children;
        var levels = data.levels

        //a function that will recurse down the tree and store values as it goes
        function findVals(node, currLevel) {
            //calculate the sum of values below this node first
            var sum = 0;
            for (var j = 0; (node.children !== undefined) && (j < node.children.length); j++) {
                sum += findVals(node.children[j], currLevel + 1);
            }

            //now check what kind of root this is and respond accordingly
            if (levels[currLevel] === name) {
                var addr = parseInt(node.addr, 16);
                if (node.value !== undefined) {
                    result[addr] += node.value;
                } else {
                    result[addr] += sum;
                }
            } else if (node.value !== undefined) {
                return node.value;
            } else {
                return sum;
            }
        }

        //run the recursion on the first level of values
        for (var i = 0; i < level.length; i++) {
            findVals(level[i], 0)
        }
    }
    this.data = result;
}

/*
 * Select everything on the histogram - essentially the same as selecting nothing
 */
Histogram.prototype._selectAll = function() {
    this.currentSelection = [];
    for (var i = 0; i < this.tags.length; i++) {
        if ($.inArray(i, this.ignoreList) === -1) {
            this.currentSelection.push(i);
        }
    }
}

/*
 * Get the list of tags for the current selection
 */
Histogram.prototype._selectedList = function() {
    var result = undefined;
    if (this.currentSelection.length !== 0) {
        result = [];
        for (var i = 0; i < this.currentSelection.length; i++) {
            result.push(this.tags[this.currentSelection[i]]);
        }
    }
    return result;
}

/*
 * sets the size of the canvas based on the number of labels and their text
 */
Histogram.prototype._setDimensions = function() {
    //set text options
    this.ctx.font = "9pt Arial";
    this.ctx.fillStyle = "rgb(170,170,170)";
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "top";

    //compute the maximum width
    var max = 0;
    var size = 0;
    for (var i = 0; i < this.labels.length; i++) {
        size = this.ctx.measureText(this.labels[i]).width;
        max = (size > max) ? size : max;
    }
    max += _HISTOGRAM_PADDING;
    this.maxLabelWidth = max;

    //resize the bars if we need to
    if (max + _HISTOGRAM_BAR_WIDTH > _HISTOGRAM_MAX_WIDTH) {
        this.barWidth = _HISTOGRAM_MAX_WIDTH - max - _HISTOGRAM_PADDING
    }

    //set the canvas size
    this.canvas.width = max + (_HISTOGRAM_PADDING * 4) + this.barWidth; //2 for edges, 2 for space between text and bars
    this.canvas.height = (this.tags.length + 1 - this.ignoreList.length) * _HISTOGRAM_BAR_HEIGHT; // +1 for the title
    this.canvasWidth = this.canvas.width;
    this.canvasHeight = this.canvas.height;
}

/*
 * Tells the histogram to query the server and get data
 */
Histogram.prototype.update = function() {
    var that = this;

    //create the query
    var cats = constrainer.getOtherCategories(this.dim);
    cats = (cats === undefined) ? {} : cats;
    var when = constrainer.getTime();
    var opts = {
        time: when,
        where: cats,
        region: constrainer.getTiles(),
        fields: [this.dim]
        };

    //run and send the query
    nanocube.category(opts, function(data) {
        that._newData(data);

        //after processing all the data, draw it
        that.draw();
    });
}

/*
 * Updates the internal state and the constrainer as to what the selected value of this histogram is
 */
Histogram.prototype._updateSelected = function(selected) {
    var index = $.inArray(selected, this.currentSelection);

    //Add or remove from the selection list
    if (index !== -1) {
        this.currentSelection.splice(index, 1);
    } else {
        this.currentSelection.push(selected);
    }
    constrainer.setCategory(this.dim, this._selectedList());

    //redraw
    this.draw();
}
