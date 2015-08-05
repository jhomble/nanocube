function startSearch() {
    var tiles = constrainer.getTiles();
    var goldsteinCodes = constrainer.getCategory("goldstein");
    var eventCodes = constrainer.getCategory("erc");
    var dateRange = constrainer.getTime();
    var url = "";
    
    //check whether or not there are any selections
    if (tiles === undefined && goldsteinCodes === undefined && eventCodes === undefined && dateRange === undefined){
        alert("Please make a selection to export data.");
        return;
    }
    
    //create the geographic string
    geoConstraint = "";
    if (tiles !== undefined){
        var latLons = tileListToLatLon(tiles);
        for (var i = 0; i < latLons.length; i++){
            geoConstraint += latLons[i].lat + "," + latLons[i].lon + ";";
        }
        geoConstraint = geoConstraint.slice(0,-1);
        geoConstraint = encodeURIComponent(geoConstraint);
        if (url !== ""){
            url += "&";
        }
        url += "geo=" + geoConstraint;
    }
    
    //create the date string
    var dateConstraint = "";
    if (dateRange !== undefined){
        var fromDate = nanocube.from_tbin(dateRange.from);
        var toDate = nanocube.from_tbin(dateRange.to);
        dateConstraint =  
                fromDate.getUTCFullYear() + 
                ("0" + (fromDate.getUTCMonth()+1)).slice(-2) + 
                ("0" + fromDate.getUTCDate()).slice(-2) + 
                ";" + 
                toDate.getUTCFullYear() + 
                ("0" + (toDate.getUTCMonth()+1)).slice(-2) + 
                ("0" + toDate.getUTCDate()).slice(-2);
        dateConstraint = encodeURIComponent(dateConstraint);
        if (url !== ""){
            url += "&";
        }
        url += "date=" + dateConstraint;
    }
    
    //create the goldstein string
    var goldsteinConstraint = "";
    if (goldsteinCodes !== undefined){
        for (var i = 0 ; i < goldsteinCodes.length; i++){
            goldsteinConstraint += goldsteinCodes[i] + ";";
        }
        goldsteinConstraint = goldsteinConstraint.slice(0,-1);
        goldsteinConstraint = encodeURIComponent(goldsteinConstraint);
        if (url !== ""){
            url += "&";
        }
        url += "goldstein=" + goldsteinConstraint;
    }
    
    //create the event code string
    eventConstraint = "";
    if (eventCodes !== undefined){
        for (var i = 0; i < eventCodes.length; i++){
            //this works but in general there probably should be a dictionary to convert
            eventConstraint += (nanocube.getCategoryNumber("erc", eventCodes[i]) + 1) + ";";
        }
        eventConstraint = eventConstraint.slice(0,-1);
        eventConstraint = encodeURIComponent(eventConstraint);
        if (url !== ""){
            url += "&";
        }
        url += "event=" + eventConstraint;
    }
    url = "/cgi-bin/gdelt_export.py?" + url;
    window.open(url);
}