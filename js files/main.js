var map;
var mapLayer;
var mapTiles;
var nanocube;
var colormapRed;
var currResolution = 7;
var timeseries;
var histograms = [];
var constrainer;
var drawer;
var eventTypes = ["no ratings",".5", "1", "1.5", "2", "2.5", "3","3.5", "4", "4.5", "5"];
var port = "29501";

// change to the name of your nanocube server port here and in features.js


/*
 * Beginning of execution
 */
$(function(){
    //nanocube = new Nanocube({ url: "http://nanocube.govspc.att.com:29512" });
    nanocube = new Nanocube({ url: "http://nanocube.govspc.att.com:" + port });
    constrainer = new Constrainer();
    drawer = new Drawer("pos");
    //timeseries = new Timeseries(document.getElementById("timeseriesCanvas"), ["#fc4e2a"]);
    timeseries = new Timeseries($("#timeseries"), ["#fc4e2a"]);
    histograms.push(new Histogram(document.getElementById("eventtypeHistogramCanvas"), "ratings", eventTypes, {
        title: "Ratings",
    //    labels: eventTypes,
        color: "#fc4e2a",
        selectedColor: "#fed976",
    }));
    // histograms.push(new Histogram(document.getElementById("goldsteinHistogramCanvas"), "goldstein", goldsteinTypes, {
        // title: "Goldstein Scale",
        // color: "#fc4e2a",
        // selectedColor: "#fed976",
    // }));

    createColormaps();
    createMap();
    addDrawControls();
    addTimeseriesModeButton();
    addExportButton();
    addListeners();
    updateInfoTip();
});
