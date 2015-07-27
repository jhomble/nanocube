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
            $("#AnomPopout").toggle();
            //alert("Magical Unicorns")
        }
    });

    map.addControl(new anomalyButton());
}

function addAnomalyContainer(){
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
                $("#anomaliesDiv").show();

            } else {
                this.anom.style.backgroundPosition = "2px 2px";
                this.anom.title = 'Show the list of Anomalies';
                $("#anomaliesDiv").hide();
            }         


        }
    });

    map.addControl(new anomalyContainer());
}

$(function(){
   // var mainAnomaliesDiv = $('<div>', {id: "mainAnomaliesDiv"})

    //;
    var newAnomaliesDiv = $('<div>', {id: "anomaliesDiv"})
        .addClass("pull-left")
        .addClass("container")
        .css("left", "50px")
        .css("top", "30px")
        .css("position", "absolute")
        .css("width", "220px")
        .css("display", "none")
    ;

    var anomalyList = $('<select>', { id: "anomalyList" })
        .addClass("form -ontrol")
        .attr("size", 15)
        .css("width", "100%")
        .css("height", "175px")

    ;

    var anomalyDescription = $('<div>', { id: "anomalyDescription" })
        .css("overflow-y", "scroll")
        .css("background-color", "white")
        .css("height", "150px")
        .css("weight", "100%")
    ;
    var saveAnomaly = $('<button>', {id: "anomalyButtonSave"})
        .addClass("btn btn-primary")
        .css("width", "190px")
        .css("height", "30px")
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
                item = _currList[value]
                console.log(item)
                $('#selectFeature').append($(document.createElement("option"))
                    .attr("value", _featureList.length)
                    .text(item.name)
                );

                _featureList.push(item)
                $.ajax({
                    url: "/cgi-bin/writeToFeatureList.py",
                    type: "POST",
                    data: JSON.stringify(_featureList),
                    success: function(response){
                        alert("The Magical Unicorn has Landed")
                    },
                    error: function(jqXHR, textStatus, errorThrown){
                        alert("Feature could not be added on server!");
                    }
                });

            }    
        })

    newAnomaliesDiv.append(anomalyList);
    newAnomaliesDiv.append(anomalyDescription);
    newAnomaliesDiv.append(saveAnomaly);

    $("body").append(newAnomaliesDiv);

    ///////////////////////////////////////////////////////////////////////////////////////

    var AnomPopout = $('<div>', {id: "AnomPopout"})
        .addClass("container")
        .css("border", "2px solid orange")
        .css("position", "relative")
        .css("background-color", "#eee")
        .css("width", "270px")
        .css("height", "150px")
        .css("display", "none")

    ;

   //var fullAnom = '<input type="radio" name="button"';

    AnomPopout.append('<p class="text-primary"><b>Choose anomaly detection type</b></p>');
    var anomalyList = $('<button>', { id: "anomalyList" })
        .css("width", "100%")
        .css("height", "300px")
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
                fullanomalydetection();
            }
            else if ($('#test2').is(':checked')) {
                //alert("Running detection");
                anomalydetection();
            }
            else {
                alert("Select an option!");
            }
        })
    ;

    var loadingmessage = $('<p id="loadingmessage">...</p>')

    
    AnomPopout.append(anombutton1);
    AnomPopout.append('<label for="test1">Full detection</label>');
    AnomPopout.append('<br/>');
    AnomPopout.append(anombutton2);
    AnomPopout.append('<label for="test2">Region detection</label>');
    AnomPopout.append('<br/>');
    AnomPopout.append(anombutton3);
    AnomPopout.append($('<img id="loadingbar" src="/css/images/loading_bar.gif" />'))
    AnomPopout.append(loadingmessage);
    newAnomaliesDiv.append(AnomPopout);

    //$("body").append(AnomPopout);

    addAnomalyButton();
    addAnomalyContainer();


});
