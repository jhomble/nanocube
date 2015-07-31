// time start and end for the timeline of data
var timestart = "1";
var timeend = "9";
// defaults for min and max level | 2 and 12
var minlevel = "2";
var maxlevel = "12";
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

/*function addAnomalyContainer(){
    var anomalyContainer = L.Control.extend({
        options: {
            position: 'topleft',
        },

        onAdd: function () {
            var container = L.DomUtil.create('div', 'leaflet-bar');

            this.anom = L.DomUtil.create('a', 'leaflet-bar-part', container);
            this.anom.href = '#';
            L.DomEvent.on(this.anom, 'click', this._click, this);
            this.anom.title = 'Show the list of Anomalies';
            this.anom.style.backgroundImage = "url('css/images/fa-folder-open-o-times.png')"; //css is being set but not actually applied for some reason
            this.anom.style.backgroundPosition = "4px 4px"

            return container;
        },

        _click: function (e){
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);

             if (this.anom.title === 'Show the list of Anomalies'){
                this.anom.style.backgroundPosition = "2px -20px";
                this.anom.title = 'Hide the list of Anomalies';
                $("#newAnomaliesDiv").show();

            } else {
                this.anom.style.backgroundPosition = "2px 2px";
                this.anom.title = 'Show the list of Anomalies';
                $("#newAnomaliesDiv").hide();
            }         


        }
    });

    map.addControl(new anomalyContainer());
}*/
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
        .addClass("pull-left")
        .addClass("container")
        .css("left", "1px")
        .css("top", "157x")
        .css("position", "absolute")
        .css("width", "100%")
        .show()
    ;

    var anomalyList = $('<select>', { id: "anomalyList" })
        .addClass("form-control")
        .attr("size", 15)
        .css("width", "100%")
        .css("height", "175px")
        .click(function(){
            anomalySelected()
        })

    ;

    var anomalyDescription = $('<div>', { id: "anomalyDescription" })
        .css("overflow-y", "scroll")
        .css("background-color", "white")
        .css("height", "150px")
        .css("weight", "100%")
    ;
    var saveAnomaly = $('<button>', {id: "anomalyButtonSave"})
        .addClass("btn btn-primary")
        .css("width", "50%")
        .css("height", "15%px")
        .text("Save Anomaly")
        .click(function(){
            var value = $("#anomalyList").val();
            if(value != null){
                /*for(var i = 0; i < _currList.length; i++){
                    console.log(_currList[i].name)
                    if(value == _currList[i].name){
                        item = _currList[i];
                        console.log("found")
                        break;
                    }
                }*/
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
        .css("width", "50%")
        .css("height", "15%px")
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
                    $("#anomalyDescription").text(_currList[value].description);
                }
            }
        })
    ;

    newAnomaliesDiv.append(anomalyList);
    newAnomaliesDiv.append(anomalyDescription);
    newAnomaliesDiv.append(saveAnomaly);
    newAnomaliesDiv.append(editButton);
    //$("body").append(newAnomaliesDiv);

    ///////////////////////////////////////////////////////////////////////////////////////

    var AnomPopout = $('<div>', {id: "AnomPopout"})
        .addClass("container")
        .css("border", "2px solid orange")
        .css("position", "relative")
        .css("background-color", "#eee")
        .css("width", "270px")
        .css("height", "150px")
        .css("display", "none")
        .show()

    ;

   //var fullAnom = '<input type="radio" name="button"';

    AnomPopout.append('<p class="text-primary"><b>Choose anomaly detection type</b></p>');
    var anomalyList = $('<button>', { id: "anomalyList" })
        .css("width", "100%")
        .css("height", "285px")
    ;
    var anombutton1 = $('<input type="radio" name="rad" id="test1" value="1">');
    var anombutton2 = $('<input type="radio" name="rad" id="test2" value="2">');
    var anombutton3 = $('<button>', { id: "runbutton" })
        .addClass("btn btn-primary")
        .css("width", "100px")
        .css("height", "35px")
        .text("RUN")
        .css("position", "absolute")
        .css("bottom", "3px")
        .css("margin-left", "10px")
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
    
    var loadingmessage = $('<p id="loadingmessage"><b>...</b></p>')
        .css("position", "absolute")
        .css("bottom", "3px")
        .css("margin-left", "185px")
        .hide()
    ;
    var loadingBar = $('<img id="loadingBar" src="/css/images/loading_bar.gif" />')
        .css("position", "absolute")
        .css("bottom", "5px")
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

    AnomPopout.append(loadingBar)
    AnomPopout.append(loadingmessage);
    //newAnomaliesDiv.append(AnomPopout);

    //$("body").append(AnomPopout);
    mainAnomaliesDiv.append(AnomPopout)
    mainAnomaliesDiv.append(newAnomaliesDiv)
    $("body").append(mainAnomaliesDiv);

    addAnomalyButton();
    //addAnomalyContainer();


});
