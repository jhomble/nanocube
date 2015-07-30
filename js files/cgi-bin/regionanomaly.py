#!python2
import sys, json, platform, os, urllib, time
from traversal import main
import cgitb
import datetime
cgitb.enable()
#print the header
print "Content-Type: text/plain\n\n",

try:
    jsonIn = json.load(sys.stdin)
    
    # port number from features.js
    port = jsonIn['portnum']
<<<<<<< HEAD
    currjson = jsonIn['feature']
    #boxlist is the list of currently selected tiles
    boxlist = jsonIn['feature']['tileSelection']

    #These are the points which will be checked to see if the box was a rectangle. 
    #This allows us to know which algorithm to run
=======

    currjson = jsonIn['feature']
    boxlist= jsonIn['feature']['tileSelection']
>>>>>>> 8ef420e5da43ed74e83377be5059d8fb248340ae
    x1 = boxlist[0]['x']
    y1 = boxlist[0]['y']
    y2 = boxlist[1]['y']
    x2 = boxlist[2]['x']
    z = boxlist[0]['level']

<<<<<<< HEAD
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

    #this checks to see if region was drawn with the square tool
    if (boxlist[0]['x'] == boxlist[1]['x'] and boxlist[2]['x'] == boxlist[3]['x'] and boxlist[0]['y'] == boxlist[3]['y'] and boxlist[1]['y'] == boxlist[2]['y']):
   
        a = main.boxAnomaly(x1, x2, y1, y2, z, port, jsonIn['timestart'], jsonIn['timeend']) #this is the list of anomalies
        #Starting to build the dictionary which will be converted to json
=======
    if (boxlist[0]['x'] == boxlist[1]['x'] and boxlist[2]['x'] == boxlist[3]['x'] and boxlist[0]['y'] == boxlist[3]['y'] and boxlist[1]['y'] == boxlist[2]['y']):

        url  = "http://nanocube.govspc.att.com:" + port + "/schema"

        response = urllib.urlopen(url)
        data = json.loads(response.read())
        timestring = data['metadata'][0]['value']

        timestringstrp = timestring[0:19]
        timebucket = timestring[len(timestring)-1]
        # this is the time bucket multipliers
        timebucketmultiplier = int(timestring[20:len(timestring)-1])

        date = time.strptime(timestringstrp,"%Y-%m-%d_%H:%M:%S")
        FIRSTDATE = int(time.mktime(date))



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

            
        a = main.boxAnomaly(x1, x2, y1, y2, z, port, jsonIn['timestart'], jsonIn['timeend'])
>>>>>>> 8ef420e5da43ed74e83377be5059d8fb248340ae
        anomlist = []
        length = len(a)
        currlength = length + 1
        geo = []
        zoomlevel = 0
<<<<<<< HEAD
        #Each anomaly has its own dictionary
        for i in range(0, length):
            anomdict = {}
            anomdict['name'] = jsonIn['feature']['name'] + "anomaly" + str(i+1)
            currdictlist = []
            #Each of the four corners of the square has its own dictionary
=======
        for i in range(0, length):
            anomdict = {}

            anomdict['name'] = jsonIn['feature']['name'] + "anomaly" + str(i+1)
            currdictlist = []
>>>>>>> 8ef420e5da43ed74e83377be5059d8fb248340ae
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
<<<<<<< HEAD
                #current time in seconds since epoch
                #timebucket multiplier is the integer which determines the bucket size. Ex: 2011-12-08_00:00:00_2d 2 would be the multiplier
=======
>>>>>>> 8ef420e5da43ed74e83377be5059d8fb248340ae
                currentTime = FIRSTDATE + (anomaly*secondsperbin*timebucketmultiplier)
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

<<<<<<< HEAD
                currdictlist.append(currdict)

            #need to find the center of of the box in latitude/longitude
            xavg = (x1+x2)/2
            yavg = (y1+y2)/2
            latlon = main.convertCoords(xavg, yavg, currlevel)
            #these coordinates are the geocenter (where the map will center on) 
            geo = [latlon[0],latlon[1]]

=======
                
                currdictlist.append(currdict)

            xavg = (x1+x2)/2
            yavg = (y1+y2)/2
            latlon = main.convertCoords(xavg, yavg, currlevel)    
            geo = [latlon[0],latlon[1]]


>>>>>>> 8ef420e5da43ed74e83377be5059d8fb248340ae
            anomdict['tileSelection'] = currdictlist
            anomdict['description'] = "Time bucket: "+ str(anomaly) +  " \nthis anomaly occured around " + str(datetime.datetime.fromtimestamp(currentTime))
            anomdict['geoCenter'] = geo
            anomdict['resolution'] = currjson['resolution']
<<<<<<< HEAD
            anomdict['timeSelect'] = dict()
            anomdict['timeZoom'] = dict()
            #These are where the timeline while zoom in on
            anomdict['timeSelect']['startMilli'] = currentTime*1000 - msecondsperbin/2
            anomdict['timeSelect']['endMilli'] = currentTime*1000 + msecondsperbin/2
            anomdict['timeZoom']['startMilli'] = None
            anomdict['timeZoom']['endMilli'] = None
=======

            anomdict['timeSelect'] = dict()
            anomdict['timeZoom'] = dict()

            anomdict['timeSelect']['startMilli'] = currentTime*1000 - msecondsperbin/2
            anomdict['timeSelect']['endMilli'] = currentTime*1000 + msecondsperbin/2
            anomdict['timeZoom']['startMilli'] = currentTime*1000 - 10*msecondsperbin
            anomdict['timeZoom']['endMilli'] = currentTime*1000 + 10*msecondsperbin

>>>>>>> 8ef420e5da43ed74e83377be5059d8fb248340ae
            anomdict['zoomLevel'] = zoomlevel
                    
            anomlist.append(anomdict)
        
        print json.dumps(anomlist)
<<<<<<< HEAD
        #print anomlist

    #this statement will run if the polygon tool was used to draw a region instead of the square tool
    else:
        #list of anomalies
        anomalies = main.polygonAnomaly(boxlist, port, jsonIn['timestart'], jsonIn['timeend'])
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

        latlon = main.convertCoords(xcoord, ycoord, boxlist[i]['level'])

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
            currpolygondict['timeSelect']['startMilli'] = long(currentTime*1000 - msecondsperbin/2)
            currpolygondict['timeSelect']['endMilli'] = long(currentTime*1000 + msecondsperbin/2)
            currpolygondict['timeZoom']['startMilli'] = None
            currpolygondict['timeZoom']['endMilli'] = None
            currpolygondict['zoomLevel'] = 3
            currpolygondict['geoCenter'] = [latlon[0], latlon[1]]
            currpolygondict['resolution'] = 7
            polygonAnomlist.append(currpolygondict)

        #The response in the javascript is what is printed from this script
        print json.dumps(polygonAnomlist)
  
=======

    else: 
        print "not a square"


        


    #print a
    #currjson = JSONEncoder().encode({"foo": ["bar", "baz"]})
    #currjson = "{ 'tileSelection': "
    #currjson += str(a)
    #currjson += "}"
    #print currjson

    if platform.system() == "Windows": #for development
        pass


        # append to the file
        #######################################################################################
        #with open("feature_list.js", "r") as fin:
        #    savefile = json.loads(fin.read())

        #for item in anomlist:
        #    savefile.append(item)

        # to append it to the file 
        #with open("feature_list.js", "w") as fout:
        #        fout.write(json.dumps(anomlist, sort_keys=True, indent=4, separators=(",",": ")))

        #######################################################################################


    else: 
    #platform is linux
        print os.getcwd()
        print "Failure"
>>>>>>> 8ef420e5da43ed74e83377be5059d8fb248340ae
except SystemExit:
    pass
except:
    print "Exception"
    print sys.exc_info()