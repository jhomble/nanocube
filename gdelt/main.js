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
var port = "28150"
var eventTypes = ["Make public statement", "Appeal", 
		"Express intent to cooperate",
                "Consult", "Engage in diplomatic cooperation", 
		"Engage in material cooperation",
                "Provide aid", "Yield", "Investigate", "Demand", "Disapprove", 
		"Reject", "Threaten", "Protest", "Exhibit force posture", 
		"Reduce relations", "Coerce", "Assault", "Fight", 
		"Use unconventional mass violence"]
var eventLabels = ["Make public statement", "Appeal", "Intent to cooperate",
                "Consult", "Diplomatic cooperation", "Material cooperation",
                "Provide aid", "Yield", "Investigate", "Demand", "Disapprove", 
		"Reject", "Threaten", "Protest", "Exhibit force posture", 
		"Reduce relations", "Coerce", "Assault", "Fight", 
		"Mass violence"]

var goldsteinTypes = ["-10", "-9", "-8", "-7", "-6", 
			"-5", "-4", "-3", "-2", "-1",
                        "0", 
			"1", "2", "3", "4", "5", 
			"6", "7", "8", "9", "10" ]

/*
 * Beginning of execution
 */
$(function(){
    //nanocube = new Nanocube({ url: "http://135.16.38.55:29512" });
    nanocube = new Nanocube({ url: "http://135.16.38.55:28150" });
    constrainer = new Constrainer();
    drawer = new Drawer("pos");
    // timeseries = new Timeseries(document.getElementById("timeseriesCanvas"), ["#fc4e2a"]);
    timeseries = new Timeseries($("#timeseries"), ["#fc4e2a"]);
    histograms.push(new Histogram(document.getElementById("eventtypeHistogramCanvas"), "erc", eventTypes, {
        title: "GDELT Event Code",
        labels: eventLabels,
        color: "#fc4e2a",
        selectedColor: "#fed976",
    }));
    histograms.push(new Histogram(document.getElementById("goldsteinHistogramCanvas"), "goldstein", goldsteinTypes, {
        title: "Goldstein Scale",
        color: "#fc4e2a",
        selectedColor: "#fed976",
    }));

    createColormaps();
    createMap();
    addDrawControls();
    addTimeseriesModeButton();
    addExportButton();
    addListeners();
    updateInfoTip();
});
