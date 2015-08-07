/* * * * * * * * * * * * * * * * * * * * * * * *  *
*  Nanocube Anomaly Detection                     *
*                                                 *
*  Authors:                                       *
*  Julien Homble, Matt Lipshultz, Andrew Cleary   *    
*                                                 *
*  Includes:                                      *
*  Anomaly detection Front end GUI                *
*  Calls to Anomaly Detection Python Files        *
*                                                 *
*  Dependencies:                                  *
*  Needs cgi-bin folder with all anomaly files    *
*  features_list.js                               *        
*  features.js                                    *
*  neccessary js files/html files to run map      *
* * * * * * * * * * * * * * * * * * * * * * * * * */

// Global variables for settings of the anomaly detection

var timestart = null;        // Which time bin to start at
var numtimebins = null;      // How many time bins to include in query
var groupsize = "1";        // How  the time bins be grouped
var minlevel = "2";         // The minimum level of the quad tree the full detection will search all quadrents for anomalies
var maxlevel = "12";        // The maximum depth search of the quad tree in the full detection until anomaly is printed
var minSplits = "3";         // How many divisions in the selected box will be processed for region anomaly
var threshold = "2";        // How many standard deviations off the mean until an anomaly will be recorded
var _currList = [];         // The list of anomalies that are reset with each search
var _featureList = [];      // The list of anomalies that are saved and only added too if save anomaly was selected.  


// This function is called when the anomaly select box is clicked on
// If an anomaly is selected, the contents of that nanomaly are shown and is zoomed in to on the map
// Otherwise show nothing
function anomalySelected(){
    var index = $("#anomalyList").val();
    if (index === _currSelectedFeature){
        $("#anomalyList").val([]);
        $("#anomalyDescription").text("");
        _currSelectedFeature = null;
        disableFeatureDelete();
    } else if (index !== null){
        forceConstraints(_currList[index]);
        $("#anomalyDescription").text(_currList[index].description);
        _currSelectedFeature = index;
        enableFeatureDelete();
    }
}

function fullanomalydetection(){
    //This makes the run button unclickable during the execution of the anomaly detection. Also shows the loading icon 
    $('#runbutton').prop("disabled",true);
    $('#loadingBar').show()
    $("#loadingmessage").show()
    //These are the currently selected categories from the histogram, set to null if there are no categories
    var categories = constrainer.getCategories();
    categories = (categories === undefined) ? null : categories;
    //This list of data is sent in json format to the CGI script, where it is then parsed
    var dataToSend = dataToSend = { 
        portnum: port,
        timestart: timestart,
        numtimebins: numtimebins,
        minlevel : minlevel,
        maxlevel : maxlevel,
        stdev: threshold,
        groupsize: groupsize,
        histograms: categories, 
        eventTypes: eventTypes,   //eventTypes is the list of events that display on the histogram. They must be matched up with their value so the correct query can be sent
        timeSelect: timeseries.getSelectRange() }
    //ajax call to the CGI script
	$.ajax({
        url: "/cgi-bin/fullanomaly.py",
        type: "POST",
        data: ("000000000000" + JSON.stringify(dataToSend).length).slice(-12) + JSON.stringify(dataToSend), 
        //The extra zeroes prepended to our data sent to work around a problem in linux where reading from the standard in never saw an EOF and therefore would hang
        //In our CGI scripts we parse out the extra 0's and are left with the length of the data string. Then we read just the characters we need to prevent our script from hanging
        success: function(response){
            //After the function call returns successfully, the run button is enabled and loading message hidden
            $('#runbutton').prop("disabled",false);
            $('#loadingBar').hide()
            $("#loadingmessage").hide()
            console.log(response)
            var list = []
            list = JSON.parse(response) //The response (the list of anomalies) is parsed back to json. An empty list means no anomalies were found
            if (list.length == 0) {
                alert("No anomalies found");
            }
            else { 
                alert("Anomaly detection ran successfully")
                //appending all of the anomalies found to the list to display in the GUI
                for (var i = 0; i < list.length; i++){
                    var item = list[i];
                
                    $("#anomalyList").append( $(document.createElement("option"))
                        .text(item.name)
                        .attr("value", _currList.length)
                    );

                _currList.push(item);
                hideFeatureSaveDialog();
                }
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            //The run button should still be enabled if the script fails, displaying the error in the console as well
            alert("Anomaly detection failed")
            $('#runbutton').prop("disabled", false);
            $('#loadingBar').hide()
            $("#loadingmessage").hide()
            console.log(errorThrown)
        }
    });

}

function selectedAnomalyDetection(){
    //This makes the run button unclickable during the execution of the anomaly detection. Also shows the loading icon 
    $('#runbutton').prop("disabled",true);
    $('#loadingBar').show()
    $("#loadingmessage").show()
    //This function can be found in features.js, it returns properties of the current map which need to be given to the CGI script
    var newFeature = createFeatureFromCurrent();
    newFeature.name = "Run # " + _index.toString() + " " ;
    _index = _index + 1;
    //If there are no tiles selected don't run the algorithm, and alert the user to select a region
    var tiles  = constrainer.getTiles();
    if (tiles == null){
        alert("please choose a region to run detection on");
        $('#runbutton').prop("disabled",false);
        $('#loadingBar').hide()
        $("#loadingmessage").hide()
    }
    else {
        var dataToSend = {
            feature: newFeature ,
            portnum: port,
            timestart: timestart,
            numtimebins: numtimebins,
            stdev: threshold,
            minSplits: minSplits,
            groupsize: groupsize,
            eventTypes: eventTypes
        };

        $.ajax({
            url: "/cgi-bin/regionanomaly.py",
            type: "POST",
            data: ("000000000000" + JSON.stringify(dataToSend).length).slice(-12) + JSON.stringify(dataToSend),
            //The extra zeroes prepended to our data sent to work around a problem in linux where reading from the standard in never saw an EOF and therefore would hang
            //In our CGI scripts we parse out the extra 0's and are left with the length of the data string. Then we read just the characters we need to prevent our script from hanging
            success: function(response){
                //After the function call returns successfully, the run button is enabled and loading message hidden
                $('#runbutton').prop("disabled",false);
                $('#loadingBar').hide()
                $("#loadingmessage").hide()
                console.log(response)
                var list = []
                list = JSON.parse(response) //The response (the list of anomalies) is parsed back to json. An empty list means no anomalies were found
                if (tiles.length != 4){
                    alert("No zooming was done for this anomaly detection. For zooming please use the square tool")
                    console.log(response)
                }
                //checking to see if the region selected is a square to let the user know what kind of detection was run (zooming or no zooming)
                else if (tiles[0]['x'] == tiles[1]['x'] && tiles[2]['x'] == tiles[3]['x'] && tiles[0]['y'] == tiles[3]['y'] && tiles[1]['y'] == tiles[2]['y']){
                    alert("Region detection run with zooming")
                }
                else {
                    alert("No zooming was done for this anomaly detection. For zooming please use the square tool")
                }
                //appending all of the anomalies found to the list to display in the GUI
                for (var i = 0; i < list.length; i++){
                    var item = list[i];
                
                    $("#anomalyList").append( $(document.createElement("option"))
                        .text(item.name)
                        .attr("value", _currList.length)
                    );
                    
                _currList.push(item);
                hideFeatureSaveDialog();
                }
                
            },
            //The run button should still be enabled if the script fails, displaying the error in the console as well
            error: function(jqXHR, textStatus, errorThrown){
                alert("Anomaly detection failed")
                $('#runbutton').prop("disabled",false);
                $('#loadingBar').hide()
                $("#loadingmessage").hide()
                console.log(errorThrown)
                console.log(textStatus)
            }
        });
    }
}

// Adds the leflet Anomaly button
function addAnomalyButton(){
    var anomalyButton = L.Control.extend({
        options: {
            position: 'topleft',
        },
        // Style of button
        onAdd: function () {
            var container = L.DomUtil.create('div', 'leaflet-bar');

            this.anom = L.DomUtil.create('a', 'leaflet-bar-part', container);
            this.anom.href = '#';
            L.DomEvent.on(this.anom, 'click', this._click, this);
            this.anom.title = 'Anomaly Detector';
            this.anom.style.backgroundImage = "url('css/images/fa-four-square.PNG')"; 
            this.anom.style.backgroundPosition = "4px 4px"

            return container;
        },
        // When clicked, toggle the mainDiv which displays the UI for anomaly detection
        // If the featuresDiv is open (contains saved anomalies), hide it
        _click: function (e){
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            $("#mainAnomaliesDiv").toggle();
            if($('#featuresDiv').is(":visible")){
                $("#leaflet-bar-part").css("backgroundPosition", "2px 2px");
                $("#leaflet-bar-part").title = 'Show the list of saved events';
                $("#featuresDiv").hide();
                disableFeatureDelete();
            }
        }
    });

    map.addControl(new anomalyButton());
}

// All divs, selects, buttons, labels, etc. for anomaly UI
// You may have to change pixels... have fun
$(function(){
    // main div that everything is contained in
    var mainAnomaliesDiv = $('<div>', {id: "mainAnomaliesDiv"})
        .addClass("container")
        .css("left", "50px")
        .css("top", "30px")
        .css("position", "absolute")
        .css("width", "300px")
        .css("display", "none")
    ;
    // Second main div containing all parts within the bottom half of the Anomaly UI (Under the Orange border)
    // On first open, open the AnomalyPopOut Div which contains the anomaly RUN buttons,
    //      the AnomalyList, AnomalyDescription, and the Save/Edit buttons
    var newAnomaliesDiv = $('<div>', {id: "anomaliesDiv"})
        .addClass("container")
        .css("width", "300px")
        .css("height", "70%")
        .show()
    ;
    // The Select box for choosing anomalies. This list is refreshed on each anomaly detection
    var anomalyList = $('<select>', { id: "anomalyList" })
        .addClass("form-control")
        .attr("size", 15)
        .css("margin-left", "0px")
        .css("width", "270px")
        .css("height", "175px")
        .click(function(){
            // Show the anomaly selected
            anomalySelected()
        })

    ;
    // Description for anomaly selected
    var anomalyDescription = $('<div>', { id: "anomalyDescription" })
        .addClass("container")
        .css("overflow-y", "scroll")
        .css("background-color", "white")
        .css("margin-left", "0px")
        .css("height", "150px")
        .css("width", "270px")
    ;
    // Div containing all the Settings options
    // When opened, it covers the Select and Description UI
    // If full or region detection are not opened, it shows up blank
    var settingsDiv = $('<div>', { id: "settingsDiv" })
        .addClass("container")
        .css("background-color", "white")
        .css("height", "325px")
        .css("width", "270px")
        .css("position", "absolute")
        .css("border", "2px solid orange")
        .css("top", "250px%")
        .hide()
    ;
    // Div containing all UI elements for full detection settings
    var fullDetectionSettingsDiv = $('<div>', { id: "fullDetectionSettingsDiv" })
        .addClass("container")
        .css("width", "100%")
        .css("height", "100%")
        .hide()
    ;
    // Contained in fullDetectionSettingsDiv, this is a drop down box for maxLevel options
    var maxLevelSel = $('<select>', {id: "maxLevelSel"})
        .css("position", "absolute")
        .css("width", "40%")
        .css("height", "10%")
        .css("left", "35%")
        .css("top", "3%")
        .show()
    ;
    // These are the options maxLevel can choose from
    var maxArr = [
        {val : "5", text: '900 miles'},
        {val : "6", text: '450 miles'},
        {val : "7", text: '225 miles'},
        {val : "8", text: '110 miles'},
        {val : "9", text: '55 miles'},
        {val : "10", text: '25 miles'},
        {val : "11", text: '12 miles'},
        {val : "12", text: '6 miles'},
        {val : "13", text: '3 miles'},
        {val : "14", text: '1.5 miles'},
        ];
    // Add the array options to the select box
    $(maxArr).each(function() {
        maxLevelSel.append($("<option>").attr('value',this.val).text(this.text));
        $(maxLevelSel).val(12)
    });
    // Label for maxLevel setting
    var maxLabel = $('<label>', { id: "maxLabel" })
        .text("Max Lvl")
        .css("position", "absolute")
        .css("top", "3%")
        .css("left", "5%")
    ;
    // Help icon for a desciption of the maxLevel setting
    var maxHelp = $('<button>', { id: "maxHelp" })
        .addClass("btn btn-default")
        .text("Info")
        .css("position", "absolute")
        .css("top", "3%")
        .css("left", "80%")
        // On hover, hide other helps, and show description
        .hover(function(){
            $('#maxHelpDivContent').toggle()
            $('#minHelp').toggle()
            $('#thresholdHelp').toggle()
            $('#groupFullHelp').toggle()
        })
    ;
    // When hovering over help icon, this Div contains the information shown
    var maxHelpDivContent = $('<div>', { id: "maxHelpDivContent" })
        .css("width", "300px")
        .css("left", "10px")
        .append('<p></p>')
        .append('<p>Set the Maximum depth search</p>')
        .append('<p></p>')
        .append('<p>This value will determine when the Anomaly</p>')
        .append('<p>Detection will stop!</p>')
        .hide()
    ;
    // contained in fullDetectionSettingsDiv, this is a drop down box for min Level settings 
    var minLevelSel = $('<select>', {id: "minLevelSel"})
        .css("position", "absolute")
        .css("width", "40%")
        .css("height", "10%")
        .css("left", "35%")
        .css("top", "20%")
        .show()
    ;
    // Options for the min Level drop down box
    var minArr = [
        {val : "0", text: '25,000 miles'},
        {val : "1", text: '12,500 miles'},
        {val : "2", text: '7,200 miles'},
        {val : "3", text: '3,600 miles'},
        {val : "4", text: '1,800 miles'},
        ];
    // Add the options to the drop down box
    $(minArr).each(function() {
        minLevelSel.append($("<option>").attr('value',this.val).text(this.text));
        $(minLevelSel).val(2)
    });
    // label for min Level setting
    var minLabel = $('<label>', { id: "minLabel" })
        .text("Min Lvl")
        .css("position", "absolute")
        .css("top", "21%")
        .css("left", "5%")
    ;
    // help icon for more information on min Level
    var minHelp = $('<button>', { id: "minHelp" })
        .addClass("btn btn-default")
        .text("Info")
        .css("position", "absolute")
        .css("top", "20%")
        .css("left", "80%")
        // on hover, show the description of the setting and hide the others
        .hover(function(){
            $('#minHelpDivContent').toggle()            
            $('#maxHelp').toggle()
            $('#thresholdHelp').toggle()
            $('#groupFullHelp').toggle()
        })
    ;
    // Description div of the information regarding minLevel
    var minHelpDivContent = $('<div>', { id: "minHelpDivContent" })
        .css("width", "300px")
        .css("left", "10px")
        .append('<p></p>')
        .append('<p>Set the Minimum depth search</p>')
        .append('<p></p>')
        .append('<p>This value will determine when the Anomaly</p>')        
        .append('<p>Detection will start ignoring empty sections!</p>')
        .hide()
    ;
    // Contained in fullDetectionSettingsDiv, this is a select box to determine the threshold for std deviation
    var thresholdSel = $('<select>', {id: "thresholdSel"})
        .css("position", "absolute")
        .css("width", "40%")
        .css("height", "10%")
        .css("left", "35%")
        .css("top", "37%")
        .show()
    ;
    // Options for the threshold drop down
    var thresholdArr = [
        {val : "1", text: '1'},
        {val : "1.5", text: '1.5'},
        {val : "2", text: '2'},
        {val : "2.5", text: '2.5'},
        {val : "3", text: '3'},
        {val : "3.5", text: '3.5'},
        {val : "4", text: '4'},
        {val : "4.5", text: '4.5'},
        {val : "5", text: '5'},
        ];
    // Add the options to the drop down
    $(thresholdArr).each(function() {
        thresholdSel.append($("<option>").attr('value',this.val).text(this.text));
        $(thresholdSel).val(2)
    });
    // Label for the threshold setting
    var thresholdLabel = $('<label>', { id: "thresholdLabel" })
        .text("Std Dev")
        .css("position", "absolute")
        .css("top", "38%")
        .css("left", "5%")
    ;
    // Help icon for more information on the threshold setting
    var thresholdHelp = $('<button>', { id: "thresholdHelp" })
        .addClass("btn btn-default")
        .text("Info")
        .css("position", "absolute")
        .css("top", "37%")
        .css("left", "80%")
        .hover(function(){
            // On hover, show the information on threshold and hide the others
            $('#thresholdHelpDivContent').toggle()            
            $('#maxHelp').toggle()
            $('#minHelp').toggle()
            $('#groupFullHelp').toggle()
        })
    ;
    // Help information for the threshold setting
    var thresholdHelpDivContent = $('<div>', { id: "thresholdHelpDivContent" })
        .css("width", "300px")
        .css("left", "10px")
        .append('<p></p>')
        .append('<p>Set the Std Deviation Threshold</p>')
        .append('<p></p>')
        .append('<p>This value will determine how many Std</p>')        
        .append('<p>Deviations from the mean will find an anomaly</p>')
        .hide()
    ;

    // Contained in fullDetectionSettingsDiv, this is a text box to determine the bucket grouping
    var bucketGroupFullText = $('<input>', {id: "bucketGroupFullText"})
        .css("position", "absolute")
        .css("width", "40%")
        .css("height", "10%")
        .css("left", "35%")
        .css("top", "53%")
        .val("1")
        .show()
    ;
    
    // Label for the full detection bucket grouping setting
    var groupFullLabel = $('<label>', { id: "groupFullLabel" })
        .text("Group Size")
        .css("position", "absolute")
        .css("top", "54%")
        .css("left", "5%")
    ;
    // Help icon for more information on the bucket group setting
    var groupFullHelp = $('<button>', { id: "groupFullHelp" })
        .addClass("btn btn-default")
        .text("Info")
        .css("position", "absolute")
        .css("top", "53%")
        .css("left", "80%")
        .hover(function(){
            // On hover, show the information on time bucket and hide the others
            $('#groupFullHelpDivContent').toggle()            
            $('#maxHelp').toggle()
            $('#minHelp').toggle()
            $('#thresholdHelp').toggle()
            $('#validateFullButton').toggle()
        })
    ;
    // Help information for the time bucket grouping setting
    var groupFullHelpDivContent = $('<div>', { id: "groupFullHelpDivContent" })
        .css("width", "300px")
        .css("left", "10px")
        .append('<p></p>')
        .append('<p>Set the Time bucket grouping</p>')
        .append('<p></p>')
        .append('<p>This value will determine how many Buckets</p>')        
        .append('<p>will be inlcuded in a group when counting them</p>')
        .hide()
    ;
    // Validate button for full anomaly detection settings. 
    // Pressing this button will save the changes in settings made and update the global variables accordingly
    var validateFullButton = $('<button>', { id: "validateFullButton" })
        .addClass("btn btn-info")
        .css("width", "40%")
        .css("position", "absolute")
        .text("Save Settings")
        .css("bottom", "2%")
        .css("right", "2%")
        .click(function(){
            minlevel = $('#minLevelSel').val()
            maxlevel = $('#maxLevelSel').val()
            threshold = $('#thresholdSel').val()
            groupsize = $('#bucketGroupFullText').val()
            // if(parseInt(groupsize) > parseInt(numtimebins)){
            //     groupsize = numtimebins;
            // }
            if(parseInt(groupsize) < 1){
                groupsize = "1"
            }
            console.log(minlevel)
            console.log(maxlevel)
            console.log(threshold)
            console.log(groupsize)
        })
    ;
    // Similar to fullDetectionSettingsDiv, this div contains all information for 
    var regionDetectionSettingsDiv = $('<div>', { id: "regionDetectionSettingsDiv" })
        .addClass("container")
        .css("width", "100%")
        .css("height", "100%")
        .hide()
    ; 
    // contained in regionDectionSettingsDiv, this is a dorp down box for minimum splits setting
    var minSplitsSel = $('<select>', {id: "minSplitsSel"})
        .css("position", "absolute")
        .css("width", "40%")
        .css("height", "10%")
        .css("left", "35%")
        .css("top", "3%")
        .show()
    ;
    // options for min splits drop down box
    var splitsArr = [
        {val : "0", text: '0'},
        {val : "1", text: '1'},
        {val : "2", text: '2'},
        {val : "3", text: '3'},
        {val : "4", text: '4'},
        {val : "5", text: '5'},
        ];
    // add the options to min splits select
    $(splitsArr).each(function() {
        minSplitsSel.append($("<option>").attr('value',this.val).text(this.text));
        $(minSplitsSel).val(3)
    });
    // label for min splits
    var splitsLabel = $('<label>', { id: "splitsLabel" })
        .text("Min Splits")
        .css("position", "absolute")
        .css("top", "4%")
        .css("left", "5%")
    ;   
    // help icon for min splits
    var splitsHelp = $('<button>', { id: "splitsHelp" })
        .addClass("btn btn-default")
        .text("Info")
        .css("position", "absolute")
        .css("top", "3%")
        .css("left", "80%")
        // on hover, show the description for min splits setting and hide others
        .hover(function(){
            $('#splitsHelpDivContent').toggle()
            $('#thresholdRegionHelp').toggle()
            $('#groupRegionHelp').toggle()
        })
    ;
    // help content description for min splits
    var splitsHelpDivContent = $('<div>', { id: "splitsHelpDivContent" })   
        .css("width", "300px")
        .css("left", "10px")
        .append('<p></p>')
        .append('<p>Set the Minimum Splits</p>')
        .append('<p></p>')
        .append('<p>This value will determine how in depth the</p>')        
        .append('<p>Detection will be. Higher number = more exact!</p>')
        .hide()
    ;
    // Contained in regionDetectionSettingsDiv, this is a drop down box for the std deviation threshold
    var thresholdRegionSel = $('<select>', {id: "thresholdRegionSel"})
        .css("position", "absolute")
        .css("width", "40%")
        .css("height", "10%")
        .css("left", "35%")
        .css("top", "37%")
        .show()
    ;
    // options for the threshold drop down 
    var thresholdRegionArr = [
        {val : "1", text: '1'},
        {val : "1.5", text: '1.5'},
        {val : "2", text: '2'},
        {val : "2.5", text: '2.5'},
        {val : "3", text: '3'},
        {val : "3.5", text: '3.5'},
        {val : "4", text: '4'},
        {val : "4.5", text: '4.5'},
        {val : "5", text: '5'},
        ];
    // add the options to the threshold drop down
    $(thresholdRegionArr).each(function() {
        thresholdRegionSel.append($("<option>").attr('value',this.val).text(this.text));
        $(thresholdRegionSel).val(2)
    });
    // label for threshold setting
    var thresholdRegionLabel = $('<label>', { id: "thresholdRegionLabel" })
        .text("Std Dev")
        .css("position", "absolute")
        .css("top", "38%")
        .css("left", "5%")
    ;
    // help icon for threshold setting
    var thresholdRegionHelp = $('<button>', { id: "thresholdRegionHelp" })
        .addClass("btn btn-default")
        .text("Info")
        .css("position", "absolute")
        .css("top", "37%")
        .css("left", "80%")
        // on hover show the help description for threshold and hide the others
        .hover(function(){
            $('#thresholdRegionHelpDivContent').toggle()
            $('#splitsHelp').toggle()
            $('#groupRegionHelp').toggle()        
        })
    ;
    // help content description for threshold
    var thresholdRegionHelpDivContent = $('<div>', { id: "thresholdRegionHelpDivContent" })
        .css("width", "300px")
        .css("left", "10px")
        .append('<p></p>')
        .append('<p>Set the Std Deviation Threshold</p>')
        .append('<p></p>')
        .append('<p>This value will determine how many Std</p>')        
        .append('<p>Deviations from the mean will find an anomaly</p>')
        .hide()
    ;
    // Contained in regionDetectionSettingsDiv, this is a text box to determine the bucket grouping
    var bucketGroupRegionText = $('<input>', {id: "bucketGroupRegionText"})
        .css("position", "absolute")
        .css("width", "40%")
        .css("height", "10%")
        .css("left", "35%")
        .css("top", "53%")
        .val("1")
        .show()
    ;
    
    // Label for the full detection bucket grouping setting
    var groupRegionLabel = $('<label>', { id: "groupRegionLabel" })
        .text("Group Size")
        .css("position", "absolute")
        .css("top", "54%")
        .css("left", "5%")
    ;
    // Help icon for more information on the bucket group setting
    var groupRegionHelp = $('<button>', { id: "groupRegionHelp" })
        .addClass("btn btn-default")
        .text("Info")
        .css("position", "absolute")
        .css("top", "53%")
        .css("left", "80%")
        .hover(function(){
            // On hover, show the information on time bucket and hide the others
            $('#groupRegionHelpDivContent').toggle()            
            $('#minSplits').toggle()
            $('#thresholdRegionHelp').toggle()
            $('#validateRegionButton').toggle()
        })
    ;
    // Help information for the time bucket grouping setting
    var groupRegionHelpDivContent = $('<div>', { id: "groupRegionHelpDivContent" })
        .css("width", "300px")
        .css("left", "10px")
        .append('<p></p>')
        .append('<p>Set the Time bucket grouping</p>')
        .append('<p></p>')
        .append('<p>This value will determine how many Buckets</p>')        
        .append('<p>will be inlcuded in a group when counting them</p>')
        .hide()
    ;
    // validate button for region settings.
    // on click, saves all the setting changes and updates the global variables associated with each one
    var validateRegionButton = $('<button>', { id: "validateRegionButton" })
        .addClass("btn btn-info")
        .css("width", "40%")
        .css("position", "absolute")
        .text("Save Settings")
        .css("bottom", "2%")
        .css("right", "2%")
        .click(function(){
            minSplits = $('#minSplitsSel').val()
            threshold = $('#thresholdRegionSel').val()
            groupsize = $('#bucketGroupRegionText').val()
            if(parseInt(groupsize) > parseInt(numtimebins)){
                groupsize = numtimebins;
            }
            if(parseInt(groupsize) < 1){
                groupsize = "1"
            }
            console.log(minSplits)
            console.log(threshold)
            console.log(groupsize)
        })
    ;
    // Button that is shown with the anomaly list / description
    // will do nothing if pressed and no anomaly selected. 
    // if an anomaly is selected, the anomaly is added to the featureslist, and therefore
    // added to the features select box which stores anomalies in the featuresList file.
    // the featureslist file will remember saved anomalies even after the website is closed
    var saveAnomaly = $('<button>', { id: "anomalyButtonSave" })
        .addClass("btn btn-primary")
        .css("width", "50%")
        .css("height", "15%")
        .text("Save Anomaly")
        .click(function(){
            // on click, add the anomaly to the featurelist
            var value = $("#anomalyList").val();
            if(value != null){
                var item = _currList[value]
                $('#selectFeature').append($(document.createElement("option"))
                    .attr("value", _featureList.length)
                    .text(item.name)
                );
                _featureList.push(item)
                // run savefeautre.py
                // this python script saves the anomaly information in the featurelist file.
                var dataToSend = { feature: item, path: window.location.pathname.split("/").slice(0, -1).join("/") };
                $.ajax({
                    url: "/cgi-bin/savefeature.py",
                    type: "POST",
                    data: JSON.stringify(dataToSend),
                    success: function(response){
                        alert("Point of Interest Saved")
                    },
                    error: function(jqXHR, textStatus, errorThrown){
                        alert("Feature could not be added on server!");
                    }
                });

            }    
        })
    // Button that is shown with the anomaly list / description
    // will do nothing if pressed and no anomaly selected
    // if an anomaly is selected, a prompt to change the name and description will pop up
    var editButton = $('<button>', { id: "editButton" }) 
        .addClass("btn btn-success")        
        .css("border", "2px solid orange")
        .css("width", "50%")
        .css("height", "15%")
        .text("Edit Anomaly")
        .click(function(){
            var value = $("#anomalyList").val();
                if(value != null){
                var item = _currList[value]
                var name = prompt("Enter Title");
                var description = prompt("Enter Description");
                if (name != null){
                    item.name = name;
                    item.description = description;
                    _currList[value] = item;
                    $('#anomalyList').prop(value).text = item.name
                    $('#anomalyDescription').text(_currList[value].description);
                }
            }
        })
    ;
    
    
    // Appends for Select, Description, Settings, and Save / Edit buttons
    newAnomaliesDiv.append(anomalyList);
    newAnomaliesDiv.append(anomalyDescription);
    newAnomaliesDiv.append(settingsDiv);
    newAnomaliesDiv.append(saveAnomaly);
    newAnomaliesDiv.append(editButton);

    // Settings append. Divs for full and region edits
    settingsDiv.append(fullDetectionSettingsDiv);
    settingsDiv.append(regionDetectionSettingsDiv);

    // Setting Options appends for Full edit
    fullDetectionSettingsDiv.append(maxLabel);
    fullDetectionSettingsDiv.append(maxLevelSel);
    fullDetectionSettingsDiv.append(maxHelp);
    maxHelp.append(maxHelpDivContent);
    fullDetectionSettingsDiv.append(minLabel);
    fullDetectionSettingsDiv.append(minLevelSel); 
    fullDetectionSettingsDiv.append(minHelp);
    minHelp.append(minHelpDivContent);
    fullDetectionSettingsDiv.append(thresholdLabel);
    fullDetectionSettingsDiv.append(thresholdSel);
    fullDetectionSettingsDiv.append(thresholdHelp);
    thresholdHelp.append(thresholdHelpDivContent);
    fullDetectionSettingsDiv.append(groupFullLabel);
    fullDetectionSettingsDiv.append(bucketGroupFullText);
    fullDetectionSettingsDiv.append(groupFullHelp);
    groupFullHelp.append(groupFullHelpDivContent);
    fullDetectionSettingsDiv.append(validateFullButton);

    // Setting Options appends for Region edit
    regionDetectionSettingsDiv.append(splitsLabel)
    regionDetectionSettingsDiv.append(minSplitsSel)
    regionDetectionSettingsDiv.append(splitsHelp)
    splitsHelp.append(splitsHelpDivContent)
    regionDetectionSettingsDiv.append(thresholdRegionLabel);
    regionDetectionSettingsDiv.append(thresholdRegionSel);
    regionDetectionSettingsDiv.append(thresholdRegionHelp);
    thresholdRegionHelp.append(thresholdRegionHelpDivContent);
    regionDetectionSettingsDiv.append(groupRegionLabel);
    regionDetectionSettingsDiv.append(bucketGroupRegionText);
    regionDetectionSettingsDiv.append(groupRegionHelp);
    groupRegionHelp.append(groupRegionHelpDivContent);
    regionDetectionSettingsDiv.append(validateRegionButton)
    ///////////////////////////////////////////////////////////////////////////////////////

    // Second main div. AnomPopout contains all objects ont he top half (in the orange border)
    var AnomPopout = $('<div>', {id: "AnomPopout"})
        .addClass("container")
        .css("border", "2px solid orange")
        .css("position", "relative")
        .css("background-color", "#eee")
        .css("width", "270px")
        .css("height", "180px")
        .css("display", "none")
        .css("left", "15px")
        .show()
    ;
    // Append the title
    AnomPopout.append('<p class="text-primary"><b>Choose anomaly detection type</b></p>');
    var anomalyList = $('<button>', { id: "anomalyList" })
        .css("width", "100%")
        .css("height", "285px")
    ;
    // Radio button for selection of full or regional anomaly detection
    var anombutton1 = $('<input type="radio" name="rad" id="test1" value="1">')
        .click(function(){
            $('#fullDetectionSettingsDiv').show()
            $('#regionDetectionSettingsDiv').hide()
        })
    ;
    // Radio button for selection of full or regional anomaly detection    
    var anombutton2 = $('<input type="radio" name="rad" id="test2" value="2">')
        .click(function(){
            $('#fullDetectionSettingsDiv').hide()
            $('#regionDetectionSettingsDiv').show()
        })
    ;
    // Run button. Runs the selected anomaly detection or prompts errors in setup
    var anombutton3 = $('<button>', { id: "runbutton" })
        .addClass("btn btn-primary")
        .css("width", "100px")
        .css("height", "36px")
        .text("RUN")
        .css("position", "absolute")
        .css("bottom", "40px")
        .css("margin-left", "5px")
        .click(function(){
            // Depending on the anomaly detection chose, run the according function
            if($('#test1').is(':checked')) {
                console.log("running")
                $('#anomalyList').empty()
                $('#anomalyDescription').empty()
                fullanomalydetection();
            }
            else if ($('#test2').is(':checked')) {
                console.log("Running detection")
                $('#anomalyList').empty()
                $('#anomalyDescription').empty()
                selectedAnomalyDetection();
            }
            else {
                alert("Select an option!");
            }
        })
    ;
    // Button to replace the anomaly list and description with the settings options
    var settingsButton = $('<button>', { id: "settingsButton" })
        .addClass("btn btn-info")
        .css("position", "absolute")
        .css("width", "100px")
        .css("height", "35px")
        .css("margin-left", "5px")
        .css("bottom", "5px")
        .text('Settings')
        .click(function(){
            // on click replace the anomaly list and description with the settings divs
            if($('#settingsButton').text() === 'Settings'){
                $('#settingsButton').text('Anomaly List')
                $('#settingsDiv').show()
                $('#anomalyList').hide()
                $('#anomalyDescription').hide()               
            }
            else{
                $('#settingsButton').text('Settings')
                $('#settingsDiv').hide()
                $('#anomalyList').show()
                $('#anomalyDescription').show()
            }
        })
    ;
    // When running the detection programs, display the loading message to show its running
    var loadingmessage = $('<p id="loadingmessage"><b>...</b></p>')
        .css("position", "absolute")
        .css("bottom", "36px")
        .css("margin-left", "185px")
        .hide()
    ;
    // When running the detection programs, display the loading bar (pacman) to show its running
    var loadingBar = $('<img id="loadingBar" src="/css/images/loading_bar.gif" />')
        .css("position", "absolute")
        .css("bottom", "38px")
        .css("margin-left", "160px")
        .hide()

    ;
    // Append all parts to the anompopout div
    AnomPopout.append(anombutton1);
    AnomPopout.append('<label for="test1">Full detection</label>');
    AnomPopout.append('<br/>');
    AnomPopout.append(anombutton2);
    AnomPopout.append('<label for="test2">Region detection</label>');
    AnomPopout.append('<br/>');
    AnomPopout.append(anombutton3);
    AnomPopout.append(settingsButton);

    AnomPopout.append(loadingBar)
    AnomPopout.append(loadingmessage);

    // add the anompopout and newanomaliesdiv to the main div
    mainAnomaliesDiv.append(AnomPopout)
    mainAnomaliesDiv.append(newAnomaliesDiv)
    // add the mainDiv / UI
    $("body").append(mainAnomaliesDiv);

    addAnomalyButton();


});
