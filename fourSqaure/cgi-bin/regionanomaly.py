#!/usr/bin/python
import sys, json, platform, os, urllib, time
from traversal import convertCoords
import main
import cgitb
import datetime
from copy import deepcopy
cgitb.enable()
#print the header
print "Content-Type: text/plain\n\n",

try:
    #load input
    if platform.system() == "Windows": #for development
        x = int(sys.stdin.read(10))
        data = sys.stdin.read(x)
        jsonIn = json.loads(data)
    else: #platform is linux
        x = int(sys.stdin.read(10))
        data = sys.stdin.read(x)
        jsonIn = json.loads(data)
    
    # port number from features.js
    port = jsonIn['portnum']
    currjson = jsonIn['feature']
    #boxlist is the list of currently selected tiles
    boxlist = jsonIn['feature']['tileSelection']
    threshold = float(jsonIn['stdev'])
    minSplits  = int(jsonIn['minSplits'])
    #These are the points which will be checked to see if the box was a rectangle. 
    #This allows us to know which algorithm to run
    x1 = boxlist[0]['x']
    y1 = boxlist[0]['y']
    y2 = boxlist[1]['y']
    x2 = boxlist[2]['x']
    z = boxlist[0]['level']

    #This url is for getting the time bin information
    url  = "http://nanocube.govspc.att.com:" + port + "/schema"

    response = urllib.urlopen(url)
    data = json.loads(response.read())
    timestring = data['metadata'][0]['value']

    timestringstrp = timestring[0:19]
    timebucket = timestring[len(timestring)-1]
    # this is the time bucket multipliers
    timebucketmultiplier = int(timestring[20:len(timestring)-1])

    #stripping the time from its format
    date = time.strptime(timestringstrp,"%Y-%m-%d_%H:%M:%S")
    FIRSTDATE = int(time.mktime(date)) #first date in seconds since epoch

    #finding the size of the time bin in seconds
    if timebucket == "s":
        secondsperbin = 1
        msecondsperbin = 1000

    elif timebucket == "m":
        secondsperbin = 60
        msecondsperbin = 1000*60

    elif timebucket == "h":
        secondsperbin = 60*60
        msecondsperbin = 1000*60*60

    elif timebucket == "d":
        secondsperbin = 60*60*24
        msecondsperbin = 1000*60*60*24

    #This url is for getting the start/end time bin information
    url  = "http://nanocube.govspc.att.com:" + port + "/tquery"
    #default, change to user defined eventually
    group_size = int(jsonIn['groupsize'])
    #get the selected time series or the full time series if none selected
    if(jsonIn['numtimebins'] == None):
        if( jsonIn['feature']['timeSelect']['startMilli'] != None ):
            tselectstart = long(jsonIn['feature']['timeSelect']['startMilli'])
            tselectend = long(jsonIn['feature']['timeSelect']['endMilli'])
            te = tselectend - tselectstart
            lasteight = int((tselectend - (FIRSTDATE*1000))/(msecondsperbin))
            window = int(te/msecondsperbin)
            starting_bucket = int((tselectstart - (FIRSTDATE*1000))/(msecondsperbin))
            #print starting_bucket
            #print window
        else:
            response = urllib.urlopen(url)
            data = json.loads(response.read())
            bothnums =  "0000000000000000" + data['root']['children'][0]['addr']
            bothnums = bothnums[-16:]
            lasteight = int(bothnums[-8:], 16)
            # first 8
            starting_bucket = int(bothnums,16) >> 32
            window = (lasteight - starting_bucket)/group_size
    else:
        window = jsonIn['numtimebins']
        starting_bucket = jsonIn['timestart']

    histograms = currjson['histograms']
    eventTypes = jsonIn['eventTypes']
    newhist = deepcopy(histograms)

    #Need to convert the histograms dictionary to the values that will be queried
    if (histograms != None):
        keys  = histograms.keys()
        for i in range(0, len(histograms)):
            for j in range(0, len(histograms[keys[i]])):
                currindex = eventTypes.index(histograms[keys[i]][j])
                newhist[keys[i]][j] = currindex
    #this checks to see if region was drawn with the square tool
    if (boxlist[0]['x'] == boxlist[1]['x'] and boxlist[2]['x'] == boxlist[3]['x'] and boxlist[0]['y'] == boxlist[3]['y'] and boxlist[1]['y'] == boxlist[2]['y']):
        a = main.boxAnomaly(x1, x2, y1, y2, z, port, starting_bucket , group_size , window, newhist, threshold, minSplits) 
        #this is the list of anomalies
        #Starting to build the dictionary which will be converted to json
        anomlist = []
        length = len(a)
        currlength = length + 1
        geo = []
        zoomlevel = 0
        #Each anomaly has its own dictionary
        for i in range(0, length):
            anomdict = {}
            anomdict['name'] = jsonIn['feature']['name'] + "anomaly" + str(i+1)
            currdictlist = []
            #Each of the four corners of the square has its own dictionary
            for j in range(0, 4):
                currdict = {}
                currlevel = a[i][4]
                zoomlevel = currlevel - 6
                currdict["level"] = currlevel
                x1 = a[i][0]
                x2 = a[i][1]
                y1 = a[i][2]
                y2 = a[i][3]

                # time bucket of anomaly
                anomaly = int(a[i][5])
                #current time in seconds since epoch
                #timebucket multiplier is the integer which determines the bucket size. Ex: 2011-12-08_00:00:00_2d 2 would be the multiplier
                currentTime = FIRSTDATE + (anomaly*secondsperbin*timebucketmultiplier)

                #Values are multiplied by 32 to draw a more accurate box. Level is increased by 5 so the same box is drawn
                if j == 0:
                    currdict["x"] = x1
                    currdict["y"] = y1
                elif j == 1:
                    currdict["x"] = x1
                    currdict["y"] = y2
                elif j == 2:
                    currdict["x"] = x2
                    currdict["y"] = y2
                elif j == 3:
                    currdict["x"] = x2
                    currdict["y"] = y1

                currdictlist.append(currdict)

            #need to find the center of of the box in latitude/longitude
            xavg = (x1+x2)/2
            yavg = (y1+y2)/2
            latlon = convertCoords(xavg, yavg, currlevel)
            #these coordinates are the geocenter (where the map will center on) 
            geo = [latlon[0],latlon[1]]

            anomdict['tileSelection'] = currdictlist
            anomdict['description'] = "Time bucket: "+ str(anomaly) +  " \nthis anomaly occured around " + str(datetime.datetime.fromtimestamp(currentTime))
            anomdict['geoCenter'] = geo
            anomdict['resolution'] = currjson['resolution']
            anomdict['timeSelect'] = dict()
            anomdict['timeZoom'] = dict()
            #These are where the timeline while zoom is on
            anomdict['timeSelect']['startMilli'] = long(currentTime*1000 - msecondsperbin)
            anomdict['timeSelect']['endMilli'] = long(currentTime*1000 + msecondsperbin)


            #zooming calculation
            if window * 0.10 > 3:
                windowpercent = int(window * 0.10)
            else:
                windowpercent = 3
            if anomaly - (windowpercent) <= 0:
                starttime = long(1000* (FIRSTDATE + (secondsperbin*timebucketmultiplier)))
            else:
                starttime = long(currentTime*1000 - (windowpercent*msecondsperbin))
            if anomaly + (windowpercent) > lasteight:
                endtime = long(1000* (FIRSTDATE + (lasteight*secondsperbin*timebucketmultiplier)))
            else:
                endtime = long(currentTime*1000 + (windowpercent*msecondsperbin))
            anomdict['timeZoom']['startMilli'] = starttime
            anomdict['timeZoom']['endMilli'] = endtime



            anomdict['zoomLevel'] = zoomlevel
            anomdict['histograms'] = currjson['histograms']

            anomlist.append(anomdict)
        
        print json.dumps(anomlist)


    #this statement will run if the polygon tool was used to draw a region instead of the square tool
    else:

        #list of anomalies
        anomalies = main.polygonAnomaly(boxlist, port, starting_bucket , group_size , window, newhist, threshold)
        polygonAnomlist = []
        xavg = 0
        yavg = 0
        tilelist = []
        #creating the list of dictionaries for tiles
        #also calculating average coordinates of the region to know where to zoom in to
        for i in range(0, len(boxlist)):
            currtiledict = {}
            xavg = xavg + boxlist[i]['x'] 
            yavg = yavg + boxlist[i]['y']
            currtiledict['x'] = boxlist[i]['x']
            currtiledict['y'] = boxlist[i]['y']
            currtiledict['level'] = boxlist[i]['level']
            tilelist.append(currtiledict)

        xcoord = xavg/(len(boxlist))
        ycoord = yavg/(len(boxlist))

        latlon = convertCoords(xcoord, ycoord, boxlist[i]['level'])

        #creating the dictionary to convert to json
        for i in range(0, len(anomalies)):
            currpolygondict = dict()
            anomaly = anomalies[i]
            currentTime = FIRSTDATE + (anomaly*secondsperbin*timebucketmultiplier)
            currpolygondict['name'] = jsonIn['feature']['name'] + "anomaly" + str(i+1)
            currpolygondict['tileSelection'] = tilelist
            currpolygondict['description'] = "Time bucket: "+ str(anomaly) +  " \nthis anomaly occured around " + str(datetime.datetime.fromtimestamp(currentTime))
            currpolygondict['timeSelect'] = dict()
            currpolygondict['timeZoom'] = dict()
            currpolygondict['timeSelect']['startMilli'] = long(currentTime*1000 - msecondsperbin)
            currpolygondict['timeSelect']['endMilli'] = long(currentTime*1000 + msecondsperbin)
            currpolygondict['timeZoom']['startMilli'] = None
            currpolygondict['timeZoom']['endMilli'] = None
            currpolygondict['geoCenter'] = [latlon[0], latlon[1]]
            currpolygondict['resolution'] = 7
            currpolygondict['histograms'] = currjson['histograms']
            polygonAnomlist.append(currpolygondict)


        #The response in the javascript is what is printed from this script
        print json.dumps(polygonAnomlist)
  
except SystemExit:
    pass
except:
    print "Exception"
    print sys.exc_info()