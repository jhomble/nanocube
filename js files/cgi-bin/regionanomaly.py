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

    currjson = jsonIn['feature']
    boxlist= jsonIn['feature']['tileSelection']
    x1 = boxlist[0]['x']
    y1 = boxlist[0]['y']
    y2 = boxlist[1]['y']
    x2 = boxlist[2]['x']
    z = boxlist[0]['level']

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
        anomlist = []
        length = len(a)
        currlength = length + 1
        geo = []
        zoomlevel = 0
        for i in range(0, length):
            anomdict = {}

            anomdict['name'] = jsonIn['feature']['name'] + "anomaly" + str(i+1)
            currdictlist = []
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

                
                currdictlist.append(currdict)

            xavg = (x1+x2)/2
            yavg = (y1+y2)/2
            latlon = main.convertCoords(xavg, yavg, currlevel)    
            geo = [latlon[0],latlon[1]]


            anomdict['tileSelection'] = currdictlist
            anomdict['description'] = "Time bucket: "+ str(anomaly) +  " \nthis anomaly occured around " + str(datetime.datetime.fromtimestamp(currentTime))
            anomdict['geoCenter'] = geo
            anomdict['resolution'] = currjson['resolution']

            anomdict['timeSelect'] = dict()
            anomdict['timeZoom'] = dict()

            anomdict['timeSelect']['startMilli'] = currentTime*1000 - msecondsperbin/2
            anomdict['timeSelect']['endMilli'] = currentTime*1000 + msecondsperbin/2
            anomdict['timeZoom']['startMilli'] = currentTime*1000 - 10*msecondsperbin
            anomdict['timeZoom']['endMilli'] = currentTime*1000 + 10*msecondsperbin

            anomdict['zoomLevel'] = zoomlevel
                    
            anomlist.append(anomdict)
        
        print json.dumps(anomlist)

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
except SystemExit:
    pass
except:
    print "Exception"
    print sys.exc_info()