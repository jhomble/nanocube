//-----------------------------------------------------------------------
// binary_xhr
//-----------------------------------------------------------------------

/*
 * Sends a request for binary data.  Used for the 'tile' query on a cube, which returns a stream of bytes 
 * representing values at a specific pixel.
 */
function binary_xhr(url, handler) {
    var xhr = new window.XMLHttpRequest();
    var ready = false;
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200
            && ready !== true) {
            if (xhr.responseType === "arraybuffer") {
                handler(xhr.response, url);
            } else if (xhr.mozResponseArrayBuffer !== null) {
                handler(xhr.mozResponseArrayBuffer, url);
            } else if (xhr.responseText !== null) {
                var data = String(xhr.responseText);
                var ary = new Array(data.length);
                for (var i = 0; i <data.length; i++) {
                    ary[i] = data.charCodeAt(i) & 0xff;
                }
                var uint8ay = new Uint8Array(ary);
                handler(uint8ay.buffer, url);
            }
            ready = true;
        }
    };
    xhr.open("GET", url, true);
    xhr.responseType="arraybuffer";
    xhr.send();
};

//-----------------------------------------------------------------------
// Dimension
//-----------------------------------------------------------------------

/*
 * A class for storing a dimension by name and type, eg 'Day of Week' and 'c1'.
 */
function Dimension (obj) {
    this.name   = obj.name
    this.type   = obj.type
    return this;
}

//-----------------------------------------------------------------------
// Nanocube
//-----------------------------------------------------------------------

/*
 * Constructor for a Nanocube object.  'opts' should be an object with a 'url' property that holds the 
 * address of the nanocube server, and a 'ready' property with a function that takes a nanocube and 
 * sets the initial properties.
 */
function Nanocube (opts) {
    this.url        = opts.url;
    this.schema     = null;
    this.dimensions = null;
    //this.updater    = new Updater(this);
    
    var that = this;
    
    //$.getJSON(this.getSchemaQuery(), function( json ) {
    $.ajax({url:this.getSchemaQuery(), dataType:'json', async:false, success:function(json){
        that.schema = json;
        that.dimensions = 
            that.schema.fields
            .filter( function (f) { return f.type.indexOf("nc_dim") == 0; } )
            .map( function (f) { return new Dimension({name: f.name, type: f.type}); } );
    }});
    
    return this;
}

/*
 * Returns the first Dimension object from 'this.dimensions' with the same dimension name.
 */
Nanocube.prototype.getDimension = function(dim_name) {
    lst = this.dimensions.filter(function (f) { return f.name===dim_name; } );
    return lst[0];
}

/*
 * Returns the string needed for a schema query to a nanocube server.
 */
Nanocube.prototype.getSchemaQuery = function() {
    return this.url + "/schema";
}

/*
 * Creates and returns a new 'Query' object for this nanocube.
 */
Nanocube.prototype.query = function() {
    return new Query(this);
}

/*
 * Returns a list of the names of the fields for this nanocube, eg pos, time, etc...
 */
Nanocube.prototype.getFieldNames = function() {
    return this.schema.fields
        .filter(function (f) { return f.type.indexOf("nc_dim") == 0;})
        .map(function (f) { return f.name; });
}

/*
 * Returns the index of 'tag' in the category named 'name'.
 */
Nanocube.prototype.getCategoryNumber = function(name, tag){
    var tempTag = tag.replace(/ /g, "_")
    var catTemp = (this.schema.fields.filter(function (f) { return f.name.indexOf(name) == 0;}))[0]
    return catTemp.valnames[tempTag]
}

/*
 * Takes a Query object 'query' and applies all of the category related options in 'opts', if there are any.  
 * Returns the altered object 'query'.
 */
Nanocube.prototype.categorySubquery = function(query, opts){
    //a tile option is formatted differently, check for it
    if (opts.tile !== undefined){
        for (f in opts.fields){
            var catNums = []

            //loop over all category restraints
            for (c in opts.fields[f]){
                catNums.push(this.getCategoryNumber(f, opts.fields[f][c]))
            }
            query.dim(f).sequence(catNums)
        }
    
    //the query case
    } else {
        //create a list of fields from the "where query"
        var whereFields = []
        var fieldNames = this.getFieldNames()
        for (f in fieldNames){
            //if (opts.where[fieldNames[f]] !== undefined){
            if (opts.where[fieldNames[f]] !== undefined && $.inArray(fieldNames[f], opts.fields) === -1){
                whereFields.push(fieldNames[f])
            }
        }

        //create a list of the other fields we are interested in
        var otherFields = []
        for (f in opts.fields){
            if ($.inArray(opts.fields[f], whereFields) === -1){
                otherFields.push(opts.fields[f])
            }
        }

        //create the queries for the where fields
        for (f in whereFields){
            var catNums = []
        
            //loop over all category restraints
            for (c in opts.where[whereFields[f]]){
                catNums.push(this.getCategoryNumber(whereFields[f], opts.where[whereFields[f]][c]))
            }
        
            query.dim(whereFields[f]).sequence(catNums)
        }

        //create the queries for the non-where fields
        for (f in otherFields){
            query.dim(otherFields[f]).findAndDive(255, 1)
        }
    }
    
    return query
}

/*
 * Takes a Query object 'query' and applies all of the region related options in 'opts', if there are any.  
 * Returns the altered object 'query'.
 */
Nanocube.prototype.regionSubqueryOld = function(query, opts){
    if (opts.region !== undefined){
        var tile1 = new Tile(opts.region.x[0], opts.region.y[0], opts.region.z)
        var tile2 = new Tile(opts.region.x[1], opts.region.y[1], opts.region.z)
        query.dim("pos").range(tile1.raw(), tile2.raw())
    } else {
        query.dim("pos").findAndDive((new Tile(0,0,0)).raw(), 0)
    }
    
    return query
}
Nanocube.prototype.regionSubquery = function(query, opts){
    if (opts.region !== undefined){
        query.dim("pos").sequence(opts.region.map(function(t){ return t.raw() }))
    } else {
        query.dim("pos").findAndDive((new Tile(0,0,0)).raw(), 0)
    }
    return query;
}

/*
 * Takes a Query object 'query' and applies all of the time related options in 'opts', if there are any.  
 * Returns the altered object 'query'.
 */
Nanocube.prototype.timeSubquery = function(query, opts){
    var timeDim = this.dimensions.filter( function(f){ return f.type.indexOf("nc_dim_time") === 0; } )[0].name;
    
    if (opts.when !== undefined){
        var to =  ~~(opts.when.to - opts.when.from)
        query.dim(timeDim).tseries(opts.when.from, 1, to)
    
    } else if (opts.time.to !== undefined) {
        var to =  ~~(opts.time.to - opts.time.from)
        query.dim(timeDim).tseries(opts.time.from, 1, to)
    
    } else {
        query.dim(timeDim).tseries(opts.time.from, opts.time.step, opts.time.count)
    }
    return query
}

/*
 * Builds, sends, and then interprets a 'tile' query to the nanocube server.  A 'tile'
 * query is how the heatmap data is received: for a zoom level, the map is broken up
 * into tiles, the result of the query is a binary stream in chunks of length 10 where the
 * first two bytes are the x and y coordinates of a "pixel" in the tile and the remaining 
 * 8 bytes are the number of points in the pixel.  The heatmap is extrapolated from this data.
 * 'opts' contains the constraints for the query, 'k' is a function that the processed data
 * will be passed to.
 */
Nanocube.prototype.tile = function(opts, k) {
    var that = this;
    var query = this.query()
    var res = opts.res;

    //check if a dimension has been specified
    var posDim = opts.dim;
    
    //check that the query isn't too deep
   // if (res + opts.tile.z > 17){
     //   res = 17 - opts.tile.z;
   // }
    
    //set the initial position query
    query.dim(posDim).drilldown().findAndDive(new Tile(opts.tile.x, opts.tile.y, opts.tile.z).raw(), res).rollup()
    
    //set a potential category query
    if (opts.fields){
        query = this.categorySubquery(query, opts)
    }
    
    if (opts.time !== undefined){
        query = this.timeSubquery(query, opts)
    }
    
    //query for the tile
    query.run_tile(function(data) {
        var version = that.version;
        if (data === null) {
            k({x:[], y:[], count:[]});
            return;
        }
        
        var record_size = 10;
        var view = new DataView(data);
        var n_records = data.byteLength / record_size;
        // slow, meh
        var x_array = new Uint8Array(n_records);
        var y_array = new Uint8Array(n_records);
        var count_array = new Float64Array(n_records);

        for (var i=0; i<n_records; ++i) {
            x_array[i] = view.getUint8(record_size*i+1) << (8 - res);
            y_array[i] = 255 - view.getUint8(record_size*i) << (8 - res);
            count_array[i] = view.getFloat64(record_size*i+2, true);
        }
        k({x: x_array, y: y_array, count: count_array});
    });
}

/*
 * Construct and send a query for the total number of points which match the constraints provided in
 * 'opts', and pass the server's response to the function 'k'.
 */
Nanocube.prototype.all = function(opts, k) {
    var allQuery = this.query();
    
    if (opts.region !== undefined){    
        allQuery = this.regionSubquery(allQuery, opts)
    }
    
    opts.fields = undefined
    if (opts.where !== undefined){
        allQuery = this.categorySubquery(allQuery, opts)
    }
    
    if (opts.time !== undefined){
        allQuery = this.timeSubquery(allQuery, opts)
    }
    
    allQuery.run_query(k)
}

/*
 * Construct and send a query that drills down in the category dimension(s) as specified in 'opts' 
 * (along with other constraints), and pass the server's response to the function 'k'.
 */
Nanocube.prototype.category = function(opts, k) {
    var catQuery = this.query();
    
    if (opts.region !== undefined){    
        catQuery = this.regionSubquery(catQuery, opts)
    }
    
    if (opts.fields !== undefined){
        catQuery = (this.categorySubquery(catQuery.drilldown(), opts)).rollup()
    }
    
    if (opts.time !== undefined){
        catQuery = this.timeSubquery(catQuery, opts)
    }
    
    catQuery.run_query(k)
}

/*
 * Calculate and return the time bin number for the given Date object 'time'.
 */
Nanocube.prototype.to_tbin = function(time) {
    var tbin = this.schema.metadata[0].value
    var s = tbin.split('_');
    var sdate = _.map(s[0].split('-'), Number);
    sdate[1] -= 1;
    var stime = _.map(s[1].split(':'), Number);
    var date = (new Date(sdate[0], sdate[1], sdate[2], stime[0], stime[1], stime[2])).getTime()
    
    var tick_units = {
        "h": 3600 * 1000,
        "d": 3600 * 1000 * 24,
        "w": 3600 * 1000 * 24 * 7
    }[s[2][s[2].length-1]];
    var ticks = Number(s[2].substr(0, s[2].length-1)) * tick_units;
    
    var delta = (time.getTime() - date);
    return ~~(delta / ticks);
}

/*
 * Calculate and return a Date object corresponding to the time bin number passed in.
 */
Nanocube.prototype.from_tbin = function(binIn) {
    var tbin = this.schema.metadata[0].value
    var s = tbin.split('_');
    var sdate = _.map(s[0].split('-'), Number);
    sdate[1] -= 1;
    var stime = _.map(s[1].split(':'), Number);
    var date = (new Date(sdate[0], sdate[1], sdate[2], stime[0], stime[1], stime[2])).getTime()
    
    var tick_units = {
        "h": 3600 * 1000,
        "d": 3600 * 1000 * 24,
        "w": 3600 * 1000 * 24 * 7
    }[s[2][s[2].length-1]];
    var ticks = Number(s[2].substr(0, s[2].length-1)) * tick_units;
    

    var newtime = date + (binIn * ticks);
    return new Date(newtime);
}

/*
 * Construct and send a query that drills down in the time dimension as specified in 'opts' 
 * (along with other constraints), and pass the server's response to the function 'k'.
 */
Nanocube.prototype.time_series = function(opts, k) {
    var tsQuery = this.query();
    var optsCopy = JSON.parse(JSON.stringify(opts))
    if (opts.region !== undefined){
        tsQuery = this.regionSubquery(tsQuery, opts)
    }
    
    optsCopy.fields = undefined
    if (opts.where !== undefined){
        tsQuery = this.categorySubquery(tsQuery, optsCopy)
    }    
    
    optsCopy.when = undefined
    if (opts.time !== undefined){
        tsQuery = this.timeSubquery(tsQuery.drilldown(), optsCopy).rollup()
    }
    
    // tsQuery.run_query(k);
    tsQuery.run_query(function(data){ k(data, opts); });
}

/*
 * Construct and send a query that drills down in the time dimension as specified in 'opts' and in category dimensions
 * (along with other constraints), and pass the server's response to the function 'k'.
 */
Nanocube.prototype.time_series_categories = function(opts, k) {
    var tsQuery = this.query();
    var optsCopy = JSON.parse(JSON.stringify(opts))
    if (opts.region !== undefined){
        tsQuery = this.regionSubquery(tsQuery, opts)
    }
    
    optsCopy.fields = undefined
    if (opts.where !== undefined){
        tsQuery = (this.categorySubquery(tsQuery.drilldown(), optsCopy)).rollup();
    }
    
    if (opts.whereConstrain !== undefined){
        for (f in opts.whereConstrain){
            optsCopy.where = opts.whereConstrain;
            tsQuery = this.categorySubquery(tsQuery, optsCopy)
            // tsQuery = tsQuery.dim(f).sequence([this.getCategoryNumber(f, opts.whereConstrain[f][0]), 20])
        }
    }
    
    optsCopy.when = undefined
    if (opts.time !== undefined){
        tsQuery = this.timeSubquery(tsQuery.drilldown(), optsCopy).rollup();
    }
    
    tsQuery.run_query(k)
}

/*
 * This takes the difference between two queries; in effect this merges them to minimize any
 * undefined values in the queries.  'q1' and 'q2' are not actually Query objects, but just
 * objects with properties, they would be passed in as 'opts' for one of the querying methods.
 */
Nanocube.diff_queries = function(q1, q2){
    var result = {
        when: ((_.isUndefined(q1.when) && !_.isUndefined(q2.when)) ||
               (_.isUndefined(q2.when) && !_.isUndefined(q1.when)) ||
               (!_.isUndefined(q1.when) && !_.isUndefined(q2.when) && 
                _.any(q1.when, function(v, k) {
                    return q2.when[k] !== v;
                }))),
        where: _.any(q1.where, function(v1, k) {
            var v2 = q2.where[k] || [];
            return v1.length != v2.length || _.any(v1, function(v_elt, i) {
                return v1[i] !== v2[i];
            });
        }) || _.any(q2.where, function(v1, k) {
            var v2 = q1.where[k] || [];
            return v1.length != v2.length || _.any(v1, function(v_elt, i) {
                return v1[i] !== v2[i];
            });
        }),
        region: ((_.isUndefined(q1.region) && !_.isUndefined(q2.region)) ||
                 (_.isUndefined(q2.region) && !_.isUndefined(q1.region)) ||
                 (!_.isUndefined(q1.region) && !_.isUndefined(q2.region) && (
                     (q1.region.z !== q2.region.z) ||
                         (q1.region.x[0] !== q2.region.x[0]) ||
                         (q1.region.x[1] !== q2.region.x[1]) ||
                         (q1.region.y[0] !== q2.region.y[0]) ||
                         (q1.region.y[1] !== q2.region.y[1]))))
    };
    return result;
}

//-----------------------------------------------------------------------
// Query
//-----------------------------------------------------------------------

/*
 * Constructor for a Query object.  Takes in a Nanocube object 'nanocube' and sets some empty
 * parameters for the query.
 */
function Query (nanocube) {
    this.nanocube       = nanocube;
    this.dimension      = null;
    this.drilldown_flag = false;
    this.query_elements = {};
}

/*
 * Restores the object to a blank state, returns the object.
 */
Query.prototype.reset = function() {
    this.query_elements = {}
    return this;
}

/*
 * Sets the current dimension that is being set to 'dim_name'.  This will usually be called multiple times,
 * as the usage is to call this function, and then immediately call the functions to set the properties of
 * the dimension, compile that query, then repeat the process with the other dimensions, before finally sending
 * the query to the server.  Returns the object.
 */
Query.prototype.dim = function(dim_name) {
    this.dimension = this.nanocube.getDimension(dim_name);
    return this;
}

/*
 * Sets a flag so that when the query on the current dimension is compiled, it will drill down, ie use '@'.
 * Returns the object.
 */
Query.prototype.drilldown = function() {
    this.drilldown_flag = true;
    return this;
}

/*
 * Sets a flag so that when the query on the current dimension is compiled, it will not drill down, ie not use '@'.
 * Returns the object.
 */
Query.prototype.rollup = function() {
    this.drilldown_flag = false;
    return this;
}

/*
 * Compiles a single query with no special options.  'addr' is the address of the query, and 'offset' is how
 * many dimensions down you wish to drill.  Returns the object.
 */
Query.prototype.findAndDive = function(addr, offset) {
    var constraint = 
        (this.drilldown_flag ? "@" : "") 
        + this.dimension.name + "="
        + addr + "+" + offset;
    this.query_elements[this.dimension.name] = constraint;
    return this;
}

/*
 * Compiles a query for all addresses in the range from 'addr0' to 'addr1' inclusive.  Used primarily for region
 * queries.  Returns the object.
 */
Query.prototype.range = function(addr0, addr1) {
    var constraint = 
        (this.drilldown_flag ? "@" : "") 
        + this.dimension.name + "="
        + "[" + addr0 + "," + addr1 + "]";
    this.query_elements[this.dimension.name] = constraint;
    return this;
}

/*
 * Compiles a query for all of the addresses in the array given by 'addr_sequence'.  Used primarily for category
 * queries.  Returns the object.
 */
Query.prototype.sequence = function(addr_sequence) {
    var constraint = 
        (this.drilldown_flag ? "@" : "") 
        + this.dimension.name + "="
        + "<" + addr_sequence.join(",") + ">";
    this.query_elements[this.dimension.name] = constraint;
    return this;
}

/*
 * Compiles a time-series styled query where 'base' is the number of the first time bin, 'bucket' is the number
 * of time bins in a bucket, and 'count' is the number of buckets.  Used only for time queries.  Returns the object.
 */
Query.prototype.tseries = function(base, bucket, count) {
    var constraint = 
        (this.drilldown_flag ? "@" : "") 
        + this.dimension.name + "="
        + base + ":" + bucket + ":" + count;
    this.query_elements[this.dimension.name] = constraint;
    return this;
}

/*
 * Sends the query to the nanocube server, and passes the response to the function 'callback'.
 */
Query.prototype.run_query = function(callback) {
    var query_string = [this.nanocube.url,"query"].concat(_.values(this.query_elements)).join("/");
    console.log(query_string);
    //This fails if the response is blank (nanocube's response for 0), so we need the fail bit to pass that along
    $.getJSON(query_string, {}, callback)
        .fail(function(){ callback(undefined); });
    return this;
}

/*
 * Sends a tile query to the nanocube server for heatmap data, and passes the response to the function 'callback'.
 */
Query.prototype.run_tile = function(callback) {
    var query_string = [this.nanocube.url,"tile"].concat(_.values(this.query_elements)).join("/");
    // console.log(query_string);
    binary_xhr(query_string, callback);
    return this;
}

//-----------------------------------------------------------------------
// Tile
//-----------------------------------------------------------------------

/*
 * The constructor for a Tile object, takes in the 'x' and 'y' coordinates of the tile, as well as the zoom 'level'.
 */
function Tile (x, y, level) {
    this.x = x || 0;
    this.y = y || 0;
    this.level = level || 0;
    return this;
}

/*
 * Converts then returns the Tile object to a string that is syntactic sugar for the address of
 * the tile.  Used for region and tile queries.
 */
Tile.prototype.raw = function() {
    return "qaddr(" + this.x + "," + this.y + "," + this.level + ")";    
}
