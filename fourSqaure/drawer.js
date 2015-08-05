function Drawer(geoDim){
    this.dim = geoDim;
    this.max = {};
}

Drawer.prototype.resetMax = function(type){
    // console.log(this.max);
    // if (type === undefined){
        this.max = {};
    // } else {
        // this.max[type] = {};
    // }
}

/*
 * potentially updates the maximum value for the given parameters
 */
Drawer.prototype._updateMax = function(val, type, level, time){
    //check if there is no object for the type or level
    if (this.max[type] === undefined){
        this.max[type] = {};
    }
    if (this.max[type][level] === undefined){
        this.max[type][level] = {};
    }
    
    //convert the time to a key
    if (time === undefined){
        time = "all";
    } else {
        time = time.from + "-" + time.to;
    }

    //check if we ought to update the max
    if (this.max[type][level][time] === undefined || val > this.max[type][level][time]){
        this.max[type][level][time] = val;
    }
}

/*
 * Gets the maximum for the specified parameters
 */
Drawer.prototype._getMax = function(type, level, time){
    //convert the time to a key
    if (time === undefined){
        time = "all";
    } else {
        time = time.from + "-" + time.to;
    }
    return this.max[type][level][time];
}

/*
 * Draws a heatmap on the canvas for a given tile
 */
Drawer.prototype._drawTile = function(canvas, data, level, type, time){
    //loop over the data and then create a new object with the log of the values
    var processed = processTileData(data);
    var log = processed.log;
    var x = processed.x;
    var y = processed.y;
    
    //update and then get the max
    this._updateMax(processed.max, type, level, time);
    var max = this._getMax(type, level, time);
    
    //set up all of the graphics objects
    var size = Math.pow(2, currResolution);
    var scale = Math.pow(2, 8-currResolution);
    var ctx = canvas.getContext('2d');
    var imgData=ctx.createImageData(size,size);
    var pixels = imgData.data; 
    
    //turn off smoothing in all of the different browsers
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;

    //create an image by setting the values of the pixels
    for (var i = 0; i < log.length; i++){
        //if the value is very small, skip it
        if(log[i] < 1e-6){ 
            return;
        }

        //get the color and set the pixel
        var color = d3.rgb(colormapRed(log[i] / max));
        var idx = (y[i] / scale) * size + (x[i] / scale);
        pixels[idx*4] = color.r;
        pixels[idx*4+1] = color.g;
        pixels[idx*4+2] = color.b;
        pixels[idx*4+3] = 190 + (65 * (log[i] / max)); //alpha, in [0, 255] - scales so that larger values stand out more
    };
    
    //move the image to a buffer, then draw
    if (canvas.width !== size){
        var newCanvas = $('<canvas>')
                .attr("width", imgData.width)
                .attr("height", imgData.height)[0];
        newCanvas.getContext("2d").putImageData(imgData, 0, 0);
        ctx.drawImage(newCanvas,0,0,canvas.width,canvas.height);
    } else {
        ctx.putImageData(imgData,0,0);
    }
}

/*
 * Handles the drawing of a new tile
 */
Drawer.prototype.mapTile = function(canvas, tile, zoom){
    //we don't want to send a request for a tile outside of the range
    var maxTile = Math.pow(2, zoom) - 1;
    if (tile.x < 0 || tile.x > maxTile || tile.y < 0 || tile.y > maxTile){
        return;
    }
    
    //get the canvas context
    var ctx = canvas.getContext('2d');
    var pos = { x:tile.x, y:tile.y, z:zoom };
    
    //create the options for the query we send
    var resolution = currResolution;
    var time = constrainer.getTime();
    var opts = {tile : { x:tile.x, y:(maxTile - tile.y), z:zoom },
                fields : constrainer.getCategories(),
                time : time,
                dim: this.dim,
                res: resolution };
    
    //run the query and draw the tile
    var that = this;
    nanocube.tile(opts, function(data){
        that._drawTile(canvas, data, zoom + resolution, 0, time);
    });
}
