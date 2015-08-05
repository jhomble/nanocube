// CONSTRUCTORS
/*
 * Tracks query parameters so that different objects which track different things can constrain other parts of the viz
 */
function Constrainer(){
    //time constraints
    this.startBin = -1;
    this.endBin = -1;
 
    //category constraints
    this.categories = {};
    this.categoryList = [];
    
    //tile constraints
    this.tileList = undefined;
}


// GETTERS
/*
 * Gets the "where" component of a query - undefined if there are no constraints currently
 */
Constrainer.prototype.getCategories = function(){
    if (this._hasCategories()){
        return this.categories;
    } else {
        return undefined;
    }
}

/*
 * Get the constraints for a specific dimension
 */
Constrainer.prototype.getCategory = function(dim){
    return this.categories[dim];
}

/*
 * Get the constraints for all the other dimensions not dim
 */
Constrainer.prototype.getOtherCategories = function(dim){
    var tempCats = JSON.parse(JSON.stringify(this.categories));
    delete tempCats[dim];
    return tempCats;
}

/*
 * Gets the region constraints as a list of 'tiles'
 */
Constrainer.prototype.getTiles = function(){
    return this.tileList;
}

/*
 * Get the 'when' component of a query
 */
Constrainer.prototype.getTime = function(){
    if (this.startBin !== -1 && this.startBin !== -1){
        // return { from: this.startBin, to: this.endBin };
        return {
            from: this.startBin,
            step: this.endBin - this.startBin,
            count: 1
            };
    } else {
        return undefined;
    }
}


// SETTERS
/*
 * Removes the region constraints
 */
Constrainer.prototype.clearTiles = function(){
    this.setTiles(undefined);
}

/*
 * Removes any time constraints
 */
Constrainer.prototype.clearTime = function(){
    this.setTime(-1, -1);
}

/*
 * Sets a category constraint of 'name' for the given dimension
 */
Constrainer.prototype.setCategory = function(dim, list){
    if (this.categoryList.indexOf(dim) < 0){
        this.categoryList.push(dim);
    }

    if (list === undefined || list.length === 0){
        this.categoryList.splice(this.categoryList.indexOf(dim), 1);
        delete this.categories[dim]
    } else {
        this.categories[dim] = list;    
    }
    
    updateInfoTip();
    timeseries.update();
    for (var h = 0; h < histograms.length; h++){
        histograms[h].update();
    }
    drawer.resetMax(dim);
    redraw();
}

/*
 * Sets the region constraint to a list of 'tile' objects - ought to be in a good order
 */
Constrainer.prototype.setTiles = function(tileList){
    this.tileList = tileList;
    updateInfoTip();
    for (var h = 0; h < histograms.length; h++){
        histograms[h].update();
    }
    timeseries.update();
}

/*
 * Takes a layer object from Leaflet.draw and then calculates the region seletected and stores it
 */
Constrainer.prototype.setTilesFromLayer = function(layer, zoom){
    var coords = layer.toGeoJSON().geometry.coordinates[0];
    coords = coords.map(function(e){ return L.latLng(e[1],e[0]); });
    coords.pop();
    var tilelist = genTileList(coords, Math.min(25, zoom));
    this.setTiles(tilelist);
}

/*
 * Sets the time constraints to the given start and end bin
 */
Constrainer.prototype.setTime = function(start, end){
    this.startBin = start;
    this.endBin = end;
    updateInfoTip();
    for (var h = 0; h < histograms.length; h++){
        histograms[h].update();
    }
    drawer.resetMax();
    redraw();
}


// PRIVATE STATE FUNCTIONS
/*
 * Checks whether or not there is anything to return for categories, so that we can return undefined instead of {}
 */
Constrainer.prototype._hasCategories = function(){
    var result = false;
    for (var i = 0; i < this.categoryList.length; i++){
        if (this.categories[this.categoryList[i]] !== undefined){
            result = true;
            break;
        }
    }    
    return result;
}
