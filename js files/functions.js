/*
 * Adds commas to a string of numbers to make it easier to read
 */
function addCommas(line){
    var length = line.length;
    var offset = -3;
    var result = ""
    while (length + offset > 0){
        if (offset === -3){
            result = "," + line.slice(offset);
        } else {
            result = "," + line.slice(offset, offset + 3) + result;
        }
        offset -= 3;
    }
    result = line.slice(0, offset + 3 + length) + result;
    return result;
}

/*
 * Adds the controls and event handlers for Leaflet.draw
 */
var _SHAPE_OPTIONS = { weight: 2, opacity:.9, color:"#DC6BA3" };
function addDrawControls(){
    //add the things which track our drawing selections
    map.drawnItems = new L.FeatureGroup();
    map.drawnItems.addTo(map);

    //set properties for our controls
    map.editControl = new L.Control.Draw({
        draw: {
            polyline: false,
            circle: false,
            marker: false,
            polygon: { allowIntersection: false }
        },
        edit: {
            featureGroup: map.drawnItems
        }
    });
    
    //set the properties of the shapes that we draw
    map.editControl.setDrawingOptions({
        rectangle:{ shapeOptions:_SHAPE_OPTIONS },
        polygon:{ shapeOptions:_SHAPE_OPTIONS }
    });
  
    //add the controls to the map
    map.editControl.addTo(map);
    
    //when we create a draw, calculate the selected tiles and pass to the constrainer
    map.on('draw:created', function (e) {
        map.drawnItems.clearLayers();//remove the old selections if they exist - WON'T TRIGGER DELETED
        map.drawnItems.addLayer(e.layer);
        constrainer.setTilesFromLayer(e.layer, e.target._zoom+8);
    });

    //if we delete a draw, remove things from the constrainer
    map.on('draw:deleted', function (e) {
        constrainer.clearTiles();
    });

    //at the end of the edit, update the constrainer
    map.on('draw:edited', function (e) {
        var layers = e.layers;
        var coords, tilelist;
        layers.eachLayer(function (layer) {
            constrainer.setTilesFromLayer(layer, e.target._zoom+8);
        });
    });
}

/*
 * Adds a button to export the selected data.
 * Based on Leaflet.EasyButton
 * Uses Font-Awesome's download-cloud icon: Font Awesome by Dave Gandy - http://fontawesome.io
 */
function addExportButton(){
    var ExportButton = L.Control.extend({
        options: {
            position: 'topleft',
        },

        onAdd: function () {
            var container = L.DomUtil.create('div', 'leaflet-bar download-icon');

            this.link = L.DomUtil.create('a', 'leaflet-bar-part', container);
            this.link.href = '#';

            L.DomEvent.on(this.link, 'click', this._click, this);
            this.link.title = 'Export selected data';

            return container;
        },

        _click: function (e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);

            // ON_CLICK FUNCTION HERE:
            // alert('DOWNLOAD STARTED');
            //startSearch();
            alert('Export currently disabled.');
        },
    });

    map.addControl(new ExportButton());
}

/*
 * Adds a button to toggle select/zoom on the timeseries.
 * Based on Leaflet.EasyButton
 * Uses Font-Awesome's area-chart icon: Font Awesome by Dave Gandy - http://fontawesome.io
 */
function addTimeseriesModeButton(){
    var TimeseriesButton = L.Control.extend({
        options: {
            position: 'topleft',
        },

        onAdd: function () {
            var container = L.DomUtil.create('div', 'leaflet-bar timeseries-icon');

            this.link = L.DomUtil.create('a', 'leaflet-bar-part', container);
            this.link.href = '#';

            L.DomEvent.on(this.link, 'click', this._click, this);
            this.link.title = 'Toggle timeseries mode';

            return container;
        },

        _click: function (e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);

            timeseries.toggleMode();
        },
    });

    map.addControl(new TimeseriesButton());
}

/*
 * Adds a listener to detect the keypresses and change the resolution - < for finer, > for coarser
 */
function addListeners(){
    //listener to detect key commands
    $(document).keydown(function(e){
        if (e.keyCode===188){
            currResolution++;
            currResolution = clamp(currResolution, 4, 8);
            redraw();
        } else if (e.keyCode===190){
            currResolution--;
            currResolution = clamp(currResolution, 4, 8);
            redraw();
        } else if (e.keyCode === 76){
            timeseries.toggleLogScale();
        } else if (e.keyCode === 72){
            printHelp();
        }
    });
    
    //check if the window has resized, and widen the timeseries accordingly
    $(window).resize(function(){
        timeseries.resize();
    });
}

/*
 * clamp a value into a certain range
 */
function clamp(val, min, max){
    return Math.min(Math.max(val, min), max);
}

/*
 * Create the colormap object we use to convert values to colors
 */
function createColormaps(){
    colormapRed = d3.scale.linear()
        .domain([0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1])
        .range(colorbrewer.YlOrRd[9].reverse());
        //The color scales are from D3's colorbrewer, 
        //see:http://bl.ocks.org/mbostock/5577023
}

/*
 * Will initialize the maps and zoom them to the center, and create the canvas layers
 */
function createMap(){
    //create the map
    map = new L.Map('map');
    map.setView(new L.LatLng(0,0), 2);
    mapLayer = L.tileLayer('http://{s}.tile.cloudmade.com/{key}/{styleid}/256/{z}/{x}/{y}.png',
                          {
                              attribution: "© Cloudmade",
                              noWrap: true,
                              key: '4f5c5233516d4c39a218425764d98def',
                              styleid: 999,
                              opacity:0.65,
                              unloadInvisibleTiles:true
                          });
    /*mapLayer = L.tileLayer('C:/Users/ab262v/Documents/maps/tiles/{z}/{x}/{y}.png',
                            {
                                attribution: "© Open Street Maps",
                                noWrap: true,
                                opacity: 0.4,
                                unloadInvisibleTiles:true,
                                maxNativeZoom: 7 //this is the maximum level that we have tiles for
                                
                            });*/
    mapLayer.addTo(map);
    
    //add the canvas layer
    mapTiles = new L.TileLayer.Canvas({ async:true, opacity:1 });//draw tiles asynchronously
    mapTiles.drawTile = dispatchTiles;
    map.addLayer(mapTiles);
}

/*
 * This is the function given to the map to handle drawing tiles - executes a pair of requests for colors
 */
function dispatchTiles(canvas, tile, zoom){
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // UNCOMMENT THIS FOR DARKER TILES BUT SLOWER DRAWS
    // ctx.fillStyle = "rgba(0,0,0,0.3)";
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = "lighter";
    drawer.mapTile(canvas, tile, zoom, this);
    this.tileDrawn(canvas);
}

/*
 * Prints an alert with controls on how to use the visualization.
 */
function printHelp(){
    alert("Use the controls on the left to zoom in or out, and create, edit, or delete a selection.\n\n\
Left click to select categories on the histogram to the right, right click to clear all selections, or select all if there are no selections.\n\n\
Right click and drag on the timeseries at the bottom to select a time range, right click again to clear.  Left click and drag to move the timeseries when zoomed.\n\n\
Press ',' to increase the resolution ('<' for smaller points).\n\
Press '.' to decrease the resolution ('>' for larger points).\n\
Press 'l' to toggle a logarithmic scale on the timeseries.");
}

/*
 * Returns an object with the data replace by the log of those values, the average of the logs, and the maximum
 * Returns { x, y, log, max, average } 
 */
function processTileData(data){
    var max = 0;
    var x = [], y = [], log = [];
    var val = 0;
    
    //loop over the data and process it
    for (var i = 0; i < data.count.length; i++){
        //if the count at this point is 0, just ignore it
        if (data.count[i] === 0){
            continue;
        }
        
        //we assume the data is always positive, which SHOULD always be true
        val = Math.log(data.count[i]) + 1; //add one for points so that val != 0, skews everything and distorts colors
        max = (max < val) ? val : max;
        
        //store the data
        x.push(data.x[i]);
        y.push(data.y[i]);
        log.push(val);
    }
    
    return { x:x, y:y, log:log, max:max }
}

/*
 * Redraws the heatmap
 */
function redraw(){
    mapTiles.redraw();
}

/*
 * Converts a list of tiles into a list of objects with properties lat, lon
 * Thanks Petr Pridal and Gavin: http://gis.stackexchange.com/questions/17278/calculate-lat-lon-bounds-for-individual-tile-generated-from-gdal2tiles
 */
function tileListToLatLon(tileList){
    var result = [];
    var lat, lon;
    var t;

    //loop over all of the tiles and convert them to lat lon
    for (var i = 0; i < tileList.length; i++){
        t = tileList[i];

        //calculate longitude
        lon = (t.x / Math.pow(2, t.level) * 360) - 180;

        //calculate latitude
        var y = (1 << t.level) - t.y - 1;
        lat = Math.PI - (2*Math.PI * y / Math.pow(2, t.level));
        lat = (180/Math.PI * Math.atan(0.5 * (Math.exp(lat) - Math.exp(-lat))));

        result.push({ lat:lat, lon:lon });
    }
    return result;
}

/*
 * Updates the tip which contains info about the current selections and constraints
 */
function updateInfoTip(){
    var time = constrainer.getTime();
    var opts = { time : time,
                where : [],
                region : constrainer.getTiles(),
                where : constrainer.getCategories() };
    nanocube.all(opts, function(data){
        //get the total number of points
        if (data === undefined){
            data = 0;
        } else {
            data = data.root.value;
        }
        
        //get the time
        var text = "";
        if (time === undefined){
            // time = { from:timeseries.binRange.min, to:timeseries.binRange.max }
            time = { from:timeseries.binRange.min, step:timeseries.binRange.max - timeseries.binRange.min }
        }
        // text = text + (nanocube.from_tbin(time.from).toUTCString().slice(0, 16)) + " - " + (nanocube.from_tbin(time.to).toUTCString().slice(0, 16)); // change the 16 to 1 -7 to include the hour
        text = text + (nanocube.from_tbin(time.from).toUTCString().slice(0, 16)) + " - " + (nanocube.from_tbin(time.from + time.step).toUTCString().slice(0, 16)); // change the 16 to 1 -7 to include the hour
        
        //display
        document.getElementById("infoTip").innerHTML = "<b>Total: " + addCommas(data.toString()) + "</b></br>" + text;
    });
}

// These were written by Lauro - use boundsToTileList() as black box
function boundsToTileList(b,zoom){
    var x0 = b.getNorthEast().lng;
    var y0 = b.getNorthEast().lat;
    var x1 = b.getSouthWest().lng;
    var y1 = b.getSouthWest().lat;

    return genTileList([L.latLng(y0,x0),L.latLng(y0,x1),
                        L.latLng(y1,x1),L.latLng(y1,x0)],
                       zoom);
}

function _degreeToTile(latlng,z,flip_y){
    //Ref: http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    //"flipped" for the nanocubes system


    //clip lat lng to boundaries
    var maxlng = 180-1e-6;
    var maxlat = 85.0511;
    latlng.lng = Math.max(-maxlng, latlng.lng);
    latlng.lng = Math.min(maxlng, latlng.lng);
    latlng.lat = Math.max(-maxlat, latlng.lat);
    latlng.lat = Math.min(maxlat, latlng.lat);

    //conversion
    var lon_deg = latlng.lng;
    var lat_rad = latlng.lat / 180 * Math.PI;

    var n = Math.pow(2,z);
    var xtile = n* ((lon_deg + 180) / 360);
    var ytile = n* (1-(Math.log(Math.tan(lat_rad)+_sec(lat_rad))/Math.PI))/2;
    xtile = Math.floor(xtile);
    ytile = Math.floor(ytile);

    if (flip_y){
        ytile = n-1-ytile;
    }
    
    //fix negative tiles
    while(xtile < 0){
        xtile += n;
    }
    
    while(ytile < 0){
        ytile += n;
    }
    
    //fix overflow tiles
    while(xtile > n){
        xtile -= n;
    }
    
    while(ytile > n){
        ytile -= n;
    }

    return {x:xtile, y:ytile};
}

function genTileList(coords, zoom){
    return coords.map(function(d){
        var txy = _degreeToTile(d,zoom,true);
        return new Tile(txy.x,txy.y,zoom);
    });
};
 
function _sec(x){
    return 1.0/Math.cos(x);
}
/////////////////////////////////////
