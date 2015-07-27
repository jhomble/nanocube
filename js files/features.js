/////////////////////////////////////////////////
// FEATURE FUNCTIONS
/////////////////////////////////////////////////
var _SHAPE_OPTIONS = { weight: 2, opacity:.9, color:"#DC6BA3" };
var _currSelectedFeature = null;
var _featureDeleteLink = null;
var _index = 1;

function forceConstraints(constraints){
    map.setView(constraints.geoCenter, constraints.zoomLevel);
    
    currResolution = clamp(constraints.resolution, 4, 8);
    redraw();

    if (constraints.histograms !== undefined && constraints.histograms !== null && histograms !== undefined && histograms.length > 0){
        constrainer.clearCategories();
        for (dim in constraints.histograms){
            if (constraints.histograms.hasOwnProperty(dim)){
                for (var i = 0; i < histograms.length; i++){
                    if (histograms[i].matchesDim(dim)){
                        histograms[i].setSelectedTags(constraints.histograms[dim]);
                    }
                }
            }
        }
    }
    
    timeseries.setViewRange(constraints.timeZoom.startMilli, constraints.timeZoom.endMilli);
    timeseries.setSelectRange(constraints.timeSelect.startMilli, constraints.timeSelect.endMilli);

    map.drawnItems.clearLayers();//remove the old selections if they exist - WON'T TRIGGER DELETED
    constrainer.setTiles(toTiles(constraints.tileSelection));
    drawPolygon(constraints.tileSelection);
    
    //Things may have come in unsynchronized - wait some amount of time and then update everything again
    setTimeout(function(){
        timeseries.update();
        for (var i = 0; i < histograms.length; i++){
            histograms[i].update();
        }
        redraw();
    }, 5000);
}

function toTiles(tileList){
    if (tileList === null || tileList === undefined || tileList.length === 0){
        return undefined;
    }
    
    var result = [];
    for (var i = 0; i < tileList.length; i++){
        result.push(new Tile(tileList[i].x, tileList[i].y, tileList[i].level));
    }
    return result;
}

function drawPolygon(tiles){
    if (tiles === null || tiles === undefined || tiles.length < 3){
        return;
    }
    
    ////////////////////////////////////////////////////////
    // do we need to account for the difference between a rectangle and a polygon?
    ////////////////////////////////////////////////////////
    var vertices = [];
    var coords = tileListToLatLon(tiles);
    for (var i = 0; i < coords.length; i++){
        vertices.push([coords.lat, coords.lon]);
    }
    
    L.polygon(coords, _SHAPE_OPTIONS).addTo(map.drawnItems);
}

function createFeatureFromCurrent(){
    var tiles = constrainer.getTiles();
    tiles = (tiles === undefined) ? null : tiles;
    
    var categories = constrainer.getCategories();
    categories = (categories === undefined) ? null : categories;
    
    return {
        timeZoom: timeseries.getViewRange(),
        timeSelect: timeseries.getSelectRange(),
        geoCenter: [map.getCenter().lat, map.getCenter().lng],
        zoomLevel: map.getZoom(),
        resolution: currResolution,
        tileSelection: tiles,
        histograms: categories,
        name: "",
        description: "",
    };
}

function validateFeatureAndSave(){
    var name = $("#featureSaveName").val();
    var description = $("#featureSaveDescription").val();
    
    //validate before saving
    if (name === ""){
        alert("Please supply name.");
        return;
    }
    for (var i = 0; i < _featureList.length; i++){
        if (_featureList[i].name === name){
            alert("Feature already exists with that name.");
            return;
        }
    }
    
    
    var newFeature = createFeatureFromCurrent();
    newFeature.name = name;
    newFeature.description = description;
    var dataToSend = { feature: newFeature, path: window.location.pathname.split("/").slice(0, -1).join("/") };
    $.ajax({
        url: "/cgi-bin/savefeature.py",
        type: "POST",
        data: JSON.stringify(dataToSend),
        success: function(response){
            response = $.trim(response);
            if (response === "Exists"){
                alert("Feature with that name already exists on server!");
            } else if (response === "Success"){
                $("#selectFeature").append( $(document.createElement("option"))
                        .attr("value", _featureList.length)
                        .text(newFeature.name)
                    );
                _featureList.push(newFeature);
                hideFeatureSaveDialog();
            } else {
                alert("Feature could not be added on server!");
                console.log(response);
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert("Feature could not be added on server!");
        }
    });
}

function showFeatureSaveDialog(){
    $(document).off('keydown');
    $("#featureSaveName").val("");
    $("#featureSaveDescription").val("");
    $("#featureSaveDiv").show();
}

function hideFeatureSaveDialog(){
    $('#featureSaveDiv').hide();
    addListeners();
}

function enableFeatureDelete(){
    if (_featureDeleteLink !== null){
        _featureDeleteLink.style.backgroundPosition = "2px -23px";
        _featureDeleteLink.style.pointerEvents = "auto";
        _featureDeleteLink.style.cursor = "pointer";
    }
}

function disableFeatureDelete(){
    if (_featureDeleteLink !== null){
        _featureDeleteLink.style.backgroundPosition = "2px 1px";
        _featureDeleteLink.style.pointerEvents = "none";
        _featureDeleteLink.style.cursor = "default";
    }
}

function deleteCurrentFeature(){
    if (confirm("Are you sure you want to delete '" + _featureList[_currSelectedFeature].name + "'?")){
        var dataToSend = { name: _featureList[_currSelectedFeature].name, path: window.location.pathname.split("/").slice(0, -1).join("/") };
        $.ajax({
            url: "/cgi-bin/deletefeature.py",
            type: "POST",
            data: JSON.stringify(dataToSend),
            success: function(response){
                response = $.trim(response);
                if (response === "Success"){
                    $("#selectFeature option[value='" + _currSelectedFeature + "']").remove();
                    $("#featureDescription").text("");
                    _currSelectedFeature = null;
                    disableFeatureDelete();
                } else {
                    alert("Feature could not be removed from server!");
                    console.log(response);
                }
            },
            error: function(jqXHR, textStatus, errorThrown){
                alert("Feature could not be removed from server!");
            }
        });
    }
}

function addFeatureButtons(){
    var FeatureButton = L.Control.extend({
        options: {
            position: 'topleft',
        },

        onAdd: function () {
            var container = L.DomUtil.create('div', 'leaflet-bar');

            this.linkShow = L.DomUtil.create('a', 'leaflet-bar-part', container);
            this.linkShow.href = '#';
            L.DomEvent.on(this.linkShow, 'click', this._clickShow, this);
            this.linkShow.title = 'Show the list of saved events';
            this.linkShow.style.backgroundImage = "url('css/images/fa-folder-open-o-times.png')"; //css is being set but not actually applied for some reason
            this.linkShow.style.backgroundPosition = "2px 2px";

            this.linkNew = L.DomUtil.create('a', 'leaflet-bar-part', container);
            this.linkNew.href = '#';
            L.DomEvent.on(this.linkNew, 'click', this._clickNew, this);
            this.linkNew.title = 'Save a new event';
            this.linkNew.style.backgroundImage = "url('css/images/fa-file-o.png')"; //css is being set but not actually applied for some reason
            
            this.linkDelete = L.DomUtil.create('a', 'leaflet-bar-part', container);
            this.linkDelete.href = '#';
            L.DomEvent.on(this.linkDelete, 'click', this._clickDelete, this);
            this.linkDelete.title = 'Delete selected event';
            this.linkDelete.style.backgroundImage = "url('css/images/fa-trash-o.png')"; //css is being set but not actually applied for some reason
            this.linkDelete.style.backgroundPosition = "2px 1px"
            this.linkDelete.style.pointerEvents = "none";
            this.linkDelete.style.cursor = "default";
            _featureDeleteLink = this.linkDelete;
            
            return container;
        },

        _clickShow: function (e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);

            if (this.linkShow.title === 'Show the list of saved events'){
                this.linkShow.style.backgroundPosition = "2px -20px";
                this.linkShow.title = 'Hide the list of saved events';
                $("#featuresDiv").show();
                if ($("#selectFeature").val() !== null){
                    enableFeatureDelete();
                }
            } else {
                this.linkShow.style.backgroundPosition = "2px 2px";
                this.linkShow.title = 'Show the list of saved events';
                $("#featuresDiv").hide();
                disableFeatureDelete();
            }            
        },
        
        _clickNew: function (e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            
            showFeatureSaveDialog();
        },
        
        _clickDelete: function(e){
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            
            deleteCurrentFeature();
        }
    });

    map.addControl(new FeatureButton());
}

$(function(){
    //add the HTML for the selector
    var mainDiv = $('<div>', { id: "featuresDiv" })
        .css("left", "50px")
        .css("top", "10px")
        .css("position", "absolute")
        .css("width", "220px")
        .css("display", "none")
    ;
    var selectList = $('<select>', { id: "selectFeature" })
        .attr("size", 15)
        .css("width", "100%")
        .css("height", "175px")
    ;
    var description = $('<div>', { id: "featureDescription" })
        .css("overflow-y", "scroll")
        .css("background-color", "white")
        .css("height", "150px")
        .css("weight", "100%")
    ;
    mainDiv.append(selectList);
    mainDiv.append(description);
    $("body").append(mainDiv);

    //load the feature file
    $.ajax({
        url: window.location.pathname.split("/").slice(0, -1).join("/") + "/feature_list.js",
        type: "GET",
        dataType: "json",
        success: function(data){ 
            window._featureList = data;
            for (var i = 0; i < _featureList.length; i++){
                selectList.append( $(document.createElement("option"))
                    .attr("value", i)
                    .text(_featureList[i].name)
                );
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert("Failed to load feature list from server.");
        },
    });
    selectList.click(featureSelected);
    
    //add the HTML for the new feature name and description box
    var newFeatureDiv = $('<div>', { id: "featureSaveDiv" })
        .css("width", "200px")
        .css("margin-left", "-100px")
        .css("left", "50%")
        .css("top", "40%")
        .css("position", "absolute")
        .css("color", "black")
        .css("font-family", "Arial")
        .css("background-color", "white")
        .css("padding-left", "10px")
        .css("padding-right", "15px")
        .css("padding-top", "10px")
        .css("padding-bottom", "10px")
        .css("border-style", "solid")
        .css("border-color", "gray")
        .css("border-width", "thick")
        .css("display", "none")
        .append($('<label>')
            .append($('<b>')
                .text("Name:")
            )
            .append($('<input>', { id: "featureSaveName", type: "text" })
                .css("width", "100%")
            )
        )
        .append($('<br>'))
        .append($('<br>'))
        .append($('<label>')
            .append($('<b>')
                .text("Description:")
            )
            .append($('<textarea>', { id: "featureSaveDescription", rows: "10" })
                .css("width", "100%")
                .css("resize", "none")
                .css("overflow-y", "scroll")
            )
        )
        .append($('<div>')
            .css("width", "100%")
            .css("text-align", "center")
            .append($('<button>')
                .text("Save")
                .attr("onclick", "validateFeatureAndSave();")
            )
            .append($('<button>')
                .text("Cancel")
                .attr("onclick", "hideFeatureSaveDialog();")
            )
        )
    ;
    $("body").append(newFeatureDiv);
    
    addFeatureButtons();
});


/////////////////////////////////////////////////
// TIMESERIES FUNCTIONS
/////////////////////////////////////////////////
Timeseries.prototype.setViewRange = function(startMilli, endMilli){
    if (startMilli === null || endMilli === null){
        this.viewRange.startMilli = null;
        this.viewRange.endMilli = null;
        this.viewRange.start = this.binRange.min;
        this.viewRange.end = this.binRange.max;
    } else {
        this.viewRange.startMilli = startMilli;
        this.viewRange.endMilli = endMilli;
        this.viewRange.start = clamp(nanocube.to_tbin(new Date(startMilli)), this.binRange.min, this.binRange.max);
        this.viewRange.end = clamp(nanocube.to_tbin(new Date(endMilli)), this.binRange.min, this.binRange.max);
    }
    this.draw();
    this.update();
}

Timeseries.prototype.setSelectRange = function(startMilli, endMilli){
    var startBin, endBin;
    if (startMilli === -1 || startMilli === undefined || startMilli === null || endMilli === -1 || endMilli === undefined || endMilli === null) {
        startMilli = -1;
        endMilli = -1;
        startBin = -1;
        endBin = -1;
    } else {
        //clamp into range given by max and min bin
        startMilli = clamp(startMilli, nanocube.from_tbin(this.binRange.min), nanocube.from_tbin(this.binRange.max));
        endMilli = clamp(endMilli, nanocube.from_tbin(this.binRange.min), nanocube.from_tbin(this.binRange.max));
        startBin = clamp(nanocube.to_tbin(new Date(startMilli)), this.binRange.min, this.binRange.max);
        endBin = clamp(nanocube.to_tbin(new Date(endMilli)), this.binRange.min, this.binRange.max);
    }    

    constrainer.setTime(startBin, endBin);
    this.selectRange.startMilli = startMilli;
    this.selectRange.endMilli = endMilli;
    this.draw();
}

Timeseries.prototype.getViewRange = function(){
    if (this.viewRange.start === -1 || this.viewRange.end === -1){
        return { startMilli: null, endMilli: null };
    } else {
        return { startMilli: this.viewRange.startMilli, endMilli: this.viewRange.endMilli };
    }
}

Timeseries.prototype.getSelectRange = function(){
    if (this.selectRange.startMilli === -1 || this.selectRange.endMilli === -1){
        return { startMilli: null, endMilli: null };
    } else {
        return { startMilli: this.selectRange.startMilli, endMilli: this.selectRange.endMilli };
    }
}


/////////////////////////////////////////////////
// HISTOGRAM FUNCTIONS
/////////////////////////////////////////////////
Histogram.prototype.matchesDim = function(dimName){
    return this.dim === dimName;
}

Histogram.prototype.setSelectedTags = function(tagList){
    var index;
    this.currentSelection = [];
    for (var i = 0; i < tagList.length; i++){
        index = $.inArray(tagList[i], this.tags);
        if (index >= 0){
            this.currentSelection.push(index);
        }
    }
    
    constrainer.setCategory(this.dim, this._selectedList());
    this.draw();
}


/////////////////////////////////////////////////
// CONSTRAINER FUNCTIONS
/////////////////////////////////////////////////
Constrainer.prototype.clearCategories = function(){
    for (var i = 0; i < this.categoryList.length; i++){
        delete this.categories[this.categoryList[i]];
        drawer.resetMax(this.categoryList[i]);
    }
    this.categoryList = [];
    
    updateInfoTip();
    timeseries.update();
    for (var h = 0; h < histograms.length; h++){
        histograms[h]._clearSelected();
        histograms[h].update();
    }
    redraw();
}