// change to the name of your nanocube server port here
// time start and end for the timeline of data
var timestart = "1";
var timeend = "9";
// defaults for min and max level | 2 and 12
var minlevel = "2";
var maxlevel = "12";
var minSplits = "3"
var threshold = "2";
var _currList = [];
var _featureList = [];

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
    $('#runbutton').prop("disabled",true);
    $('#loadingBar').show()
    $("#loadingmessage").show()
    console.log("actual")
    console.log(minlevel)
    var dataToSend = { portnum: port , timestart: timestart, timeend: timeend, minlevel : minlevel , maxlevel : maxlevel }
    $.ajax({
        url: "/cgi-bin/fullanomaly.py",
        type: "POST",
        data: JSON.stringify(dataToSend),
        success: function(response){
            $('#runbutton').prop("disabled",false);
            $('#loadingBar').hide()
            $("#loadingmessage").hide()
            console.log(response)
            var list = []
            list = JSON.parse(response)
            if (list.length == 0) {
                alert("No anomalies found");
            }
            else {
                for (var i = 0; i < list.length; i++){
                    var item = list[i];
                    //console.log(item)
                
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
            //alert("Feature could not be added on server!");
            $('#runbutton').prop("disabled",false);
            $('#loadingBar').hide()
            $("#loadingmessage").hide()
            console.log(errorThrown)
            console.log(textStatus)
        }
    });

}

function selectedAnomalyDetection(){
    
    $('#runbutton').prop("disabled",true);
    $('#loadingBar').show()
    $("#loadingmessage").show()

    var newFeature = createFeatureFromCurrent();
    newFeature.name = "Run # " + _index.toString() + " " ;
    _index = _index + 1;
    var tiles  = constrainer.getTiles();
    if (tiles == null){
        alert("please choose a region to run detection on");
    }
    //var tiles  = constrainer.getTiles();
    //var dataToSend = { tileSelection: tiles };
    //console.log(newFeature);
    var dataToSend = { feature: newFeature , portnum: port , timestart: timestart, timeend: timeend}
    $.ajax({
        url: "/cgi-bin/regionanomaly.py",
        type: "POST",
        data: JSON.stringify(dataToSend),
        success: function(response){
            $('#runbutton').prop("disabled",false);
            $('#loadingBar').hide()
            $("#loadingmessage").hide()
            console.log(response)
            var list = []
            list = JSON.parse(response)
            if (tiles.length != 4){
                alert("No zooming was done for this anomaly detection. For zooming please use the square tool")
                console.log(response)
            }
            else if (tiles[0]['x'] == tiles[1]['x'] && tiles[2]['x'] == tiles[3]['x'] && tiles[0]['y'] == tiles[3]['y'] && tiles[1]['y'] == tiles[2]['y']){
                alert("Region detection run with zooming")
            }
            else {
                alert("No zooming was done for this anomaly detection. For zooming please use the square tool")
            }
            //console.log(list)
            for (var i = 0; i < list.length; i++){
                var item = list[i];
                //console.log(item)
            
                $("#anomalyList").append( $(document.createElement("option"))
                    .text(item.name)
                    .attr("value", _currList.length)
                );
                
            _currList.push(item);
            hideFeatureSaveDialog();
            }
            
            //console.log(response)
        },
        error: function(jqXHR, textStatus, errorThrown){
            //alert("Feature could not be added on server!");
            console.log(errorThrown)
            console.log(textStatus)
        }
    });

}

function addAnomalyButton(){
    var anomalyButton = L.Control.extend({
        options: {
            position: 'topleft',
        },

        onAdd: function () {
            var container = L.DomUtil.create('div', 'leaflet-bar');

            this.anom = L.DomUtil.create('a', 'leaflet-bar-part', container);
            this.anom.href = '#';
            L.DomEvent.on(this.anom, 'click', this._click, this);
            this.anom.title = 'Anomaly Detector';
            this.anom.style.backgroundImage = "url('css/images/fa-four-square.png')"; //css is being set but not actually applied for some reason
            this.anom.style.backgroundPosition = "4px 4px"

            return container;
        },

        _click: function (e){
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            $("#mainAnomaliesDiv").toggle();
            //console.log($('#featuresDiv').is(":visible"))
            if($('#featuresDiv').is(":visible")){
                $("#leaflet-bar-part").css("backgroundPosition", "2px 2px");
                $("#leaflet-bar-part").title = 'Show the list of saved events';
                $("#featuresDiv").hide();
                disableFeatureDelete();
            }
            //alert("Magical Unicorns")
        }
    });

    map.addControl(new anomalyButton());
}

// You may have to change pixels... have fun
$(function(){
    var mainAnomaliesDiv = $('<div>', {id: "mainAnomaliesDiv"})
        .addClass("container")
        .css("left", "50px")
        .css("top", "30px")
        .css("position", "absolute")
        .css("width", "300px")
        .css("display", "none")
    ;
    var newAnomaliesDiv = $('<div>', {id: "anomaliesDiv"})
        .addClass("container")
        .css("width", "300px")
        .css("height", "70%")
        .show()
    ;

    var anomalyList = $('<select>', { id: "anomalyList" })
        .addClass("form-control")
        .attr("size", 15)
        .css("margin-left", "0px")
        .css("width", "270px")
        .css("height", "175px")
        .click(function(){
            anomalySelected()
        })

    ;

    var anomalyDescription = $('<div>', { id: "anomalyDescription" })
        .addClass("container")
        .css("overflow-y", "scroll")
        .css("background-color", "white")
        .css("margin-left", "0px")
        .css("height", "150px")
        .css("width", "270px")
    ;

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

    var fullDetectionSettingsDiv = $('<div>', { id: "fullDetectionSettingsDiv" })
        .addClass("container")
        .css("width", "100%")
        .css("height", "100%")
        .hide()
    ;

    var maxLevelSel = $('<select>', {id: "maxLevelSel"})
        .css("position", "absolute")
        .css("width", "40%")
        .css("height", "10%")
        .css("left", "35%")
        .css("top", "3%")
        .show()
    ;

    var maxArr = [
        {val : 5, text: '900 miles'},
        {val : 6, text: '450 miles'},
        {val : 7, text: '225 miles'},
        {val : 8, text: '110 miles'},
        {val : 9, text: '55 miles'},
        {val : 10, text: '25 miles'},
        {val : 11, text: '12 miles'},
        {val : 12, text: '6 miles'},
        {val : 13, text: '3 miles'},
        {val : 14, text: '1.5 miles'},
        ];

    $(maxArr).each(function() {
        maxLevelSel.append($("<option>").attr('value',this.val).text(this.text));
        $(maxLevelSel).val(12)
    });

    var maxLabel = $('<label>', { id: "maxLabel" })
        .text("Max Lvl")
        .css("position", "absolute")
        .css("top", "3%")
        .css("left", "5%")
    ;

    var maxHelp = $('<button>', { id: "maxHelp" })
        .addClass("btn btn-default")
        .text("Info")
        .css("position", "absolute")
        .css("top", "3%")
        .css("left", "80%")
        .hover(function(){
            $('#maxHelpDivContent').toggle()
            $('#minHelp').toggle()
            $('#thresholdHelp').toggle()
        })
    ;

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

    var minLevelSel = $('<select>', {id: "minLevelSel"})
        .css("position", "absolute")
        .css("width", "40%")
        .css("height", "10%")
        .css("left", "35%")
        .css("top", "20%")
        .show()
    ;

    var minArr = [
        {val : 0, text: '25,000 miles'},
        {val : 1, text: '12,500 miles'},
        {val : 2, text: '7,200 miles'},
        {val : 3, text: '3,600 miles'},
        {val : 4, text: '1,800 miles'},
        ];

    $(minArr).each(function() {
        minLevelSel.append($("<option>").attr('value',this.val).text(this.text));
        $(minLevelSel).val(2)
    });

    var minLabel = $('<label>', { id: "minLabel" })
        .text("Min Lvl")
        .css("position", "absolute")
        .css("top", "21%")
        .css("left", "5%")
    ;

    var minHelp = $('<button>', { id: "minHelp" })
        .addClass("btn btn-default")
        .text("Info")
        .css("position", "absolute")
        .css("top", "20%")
        .css("left", "80%")
        .hover(function(){
            $('#minHelpDivContent').toggle()            
            $('#maxHelp').toggle()
            $('#thresholdHelp').toggle()
        })
    ;

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

    var thresholdSel = $('<select>', {id: "thresholdSel"})
        .css("position", "absolute")
        .css("width", "40%")
        .css("height", "10%")
        .css("left", "35%")
        .css("top", "37%")
        .show()
    ;

    var thresholdArr = [
        {val : 1, text: '1'},
        {val : 1.5, text: '1.5'},
        {val : 2, text: '2'},
        {val : 2.5, text: '2.5'},
        {val : 3, text: '3'},
        {val : 3.5, text: '3.5'},
        {val : 4, text: '4'},
        {val : 4.5, text: '4.5'},
        {val : 5, text: '5'},
        ];

    $(thresholdArr).each(function() {
        thresholdSel.append($("<option>").attr('value',this.val).text(this.text));
        $(thresholdSel).val(2)
    });

    var thresholdLabel = $('<label>', { id: "thresholdLabel" })
        .text("Std Dev")
        .css("position", "absolute")
        .css("top", "38%")
        .css("left", "5%")
    ;

    var thresholdHelp = $('<button>', { id: "thresholdHelp" })
        .addClass("btn btn-default")
        .text("Info")
        .css("position", "absolute")
        .css("top", "37%")
        .css("left", "80%")
        .hover(function(){
            $('#thresholdHelpDivContent').toggle()            
            $('#maxHelp').toggle()
            $('#minHelp').toggle()
        
        })
    ;

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
            console.log(minlevel)
            console.log(maxlevel)
            console.log(threshold)
        })
    ;

    var regionDetectionSettingsDiv = $('<div>', { id: "regionDetectionSettingsDiv" })
        .addClass("container")
        .css("width", "100%")
        .css("height", "100%")
        .hide()
    ; 

    var minSplitsSel = $('<select>', {id: "minSplitsSel"})
        .css("position", "absolute")
        .css("width", "35%")
        .css("height", "10%")
        .css("left", "40%")
        .css("top", "3%")
        .show()
    ;

    var SplitsArr = [
        {val : 0, text: '0'},
        {val : 1, text: '1'},
        {val : 2, text: '2'},
        {val : 3, text: '3'},
        {val : 4, text: '4'},
        {val : 5, text: '5'},
        ];

    $(SplitsArr).each(function() {
        minSplitsSel.append($("<option>").attr('value',this.val).text(this.text));
        $(minSplitsSel).val(3)
    });

    var splitsLabel = $('<label>', { id: "splitsLabel" })
        .text("Min Splits")
        .css("position", "absolute")
        .css("top", "4%")
        .css("left", "5%")
    ;

    var splitsHelp = $('<button>', { id: "splitsHelp" })
        .addClass("btn btn-default")
        .text("Info")
        .css("position", "absolute")
        .css("top", "3%")
        .css("left", "80%")
        .hover(function(){
            $('#splitsHelpDivContent').toggle()
            $('#thresholdRegionHelp').toggle()
        })
    ;

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

    var thresholdRegionSel = $('<select>', {id: "thresholdRegionSel"})
        .css("position", "absolute")
        .css("width", "35%")
        .css("height", "10%")
        .css("left", "40%")
        .css("top", "37%")
        .show()
    ;

    var thresholdRegionArr = [
        {val : 1, text: '1'},
        {val : 1.5, text: '1.5'},
        {val : 2, text: '2'},
        {val : 2.5, text: '2.5'},
        {val : 3, text: '3'},
        {val : 3.5, text: '3.5'},
        {val : 4, text: '4'},
        {val : 4.5, text: '4.5'},
        {val : 5, text: '5'},
        ];

    $(thresholdRegionArr).each(function() {
        thresholdRegionSel.append($("<option>").attr('value',this.val).text(this.text));
        $(thresholdRegionSel).val(2)
    });

    var thresholdRegionLabel = $('<label>', { id: "thresholdRegionLabel" })
        .text("Std Dev")
        .css("position", "absolute")
        .css("top", "38%")
        .css("left", "5%")
    ;

    var thresholdRegionHelp = $('<button>', { id: "thresholdRegionHelp" })
        .addClass("btn btn-default")
        .text("Info")
        .css("position", "absolute")
        .css("top", "37%")
        .css("left", "80%")
        .hover(function(){
            $('#thresholdRegionHelpDivContent').toggle()
            $('#splitsHelp').toggle()
        
        })
    ;

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
            console.log(minSplits)
            console.log(threshold)
        })
    ;

    var saveAnomaly = $('<button>', { id: "anomalyButtonSave" })
        .addClass("btn btn-primary")
        .css("width", "50%")
        .css("height", "15%")
        .text("Save Anomaly")
        .click(function(){
            var value = $("#anomalyList").val();
            if(value != null){
                var item = _currList[value]
                $('#selectFeature').append($(document.createElement("option"))
                    .attr("value", _featureList.length)
                    .text(item.name)
                );

                _featureList.push(item)
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
    regionDetectionSettingsDiv.append(validateRegionButton)
    ///////////////////////////////////////////////////////////////////////////////////////

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

   //var fullAnom = '<input type="radio" name="button"';

    AnomPopout.append('<p class="text-primary"><b>Choose anomaly detection type</b></p>');
    var anomalyList = $('<button>', { id: "anomalyList" })
        .css("width", "100%")
        .css("height", "285px")
    ;
    var anombutton1 = $('<input type="radio" name="rad" id="test1" value="1">')
        .click(function(){
            $('#fullDetectionSettingsDiv').show()
            $('#regionDetectionSettingsDiv').hide()
        })
    ;
    var anombutton2 = $('<input type="radio" name="rad" id="test2" value="2">')
        .click(function(){
            $('#fullDetectionSettingsDiv').hide()
            $('#regionDetectionSettingsDiv').show()
        })
    ;
    var anombutton3 = $('<button>', { id: "runbutton" })
        .addClass("btn btn-primary")
        .css("width", "100px")
        .css("height", "36px")
        .text("RUN")
        .css("position", "absolute")
        .css("bottom", "40px")
        .css("margin-left", "5px")
        .click(function(){
            //$("#test1").prop("checked", true).checkboxradio("refresh");
            //var selected1 = $("#test1 input[type='radio'][value='1']:checked").checkboxradio("refresh");
            //var selected2 = $("#test2 input[type='radio'][value='2']:checked").checkboxradio("refresh");

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

    var settingsButton = $('<button>', { id: "settingsButton" })
        .addClass("btn btn-info")
        .css("position", "absolute")
        .css("width", "100px")
        .css("height", "35px")
        .css("margin-left", "5px")
        .css("bottom", "5px")
        //.css("value", "Edit Settings for Anomaly Detection")
        .text('Settings')
        .click(function(){
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
    
    var loadingmessage = $('<p id="loadingmessage"><b>...</b></p>')
        .css("position", "absolute")
        .css("bottom", "36px")
        .css("margin-left", "185px")
        .hide()
    ;
    var loadingBar = $('<img id="loadingBar" src="/css/images/loading_bar.gif" />')
        .css("position", "absolute")
        .css("bottom", "38px")
        .css("margin-left", "160px")
        .hide()

    ;
    
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

    mainAnomaliesDiv.append(AnomPopout)
    mainAnomaliesDiv.append(newAnomaliesDiv)
    $("body").append(mainAnomaliesDiv);

    addAnomalyButton();


});
