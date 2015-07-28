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

	port = jsonIn['portnum']
	timestart = jsonIn['timestart']
	timeend = jsonIn['timeend']
	minlevel = jsonIn['minlevel']
	maxlevel = jsonIn['maxlevel']


	url = "http://nanocube.govspc.att.com:"+port+"/schema"
	response = urllib.urlopen(url)
	data = json.loads(response.read())
	timestring = data['metadata'][0]['value']
	timestringstrp = timestring[0:19]
	timebucket = timestring[len(timestring)-1]
	timebucketmultiplier = int(timestring[20:len(timestring)-1])
	date = time.strptime(timestringstrp,"%Y-%m-%d_%H:%M:%S")
	FIRSTDATE = int(time.mktime(date))



	anomlist = main.fullAnomaly(port, timestart, timeend, minlevel, maxlevel)
	#print anomlist
	jsonlist = []
	for i in range(0, len(anomlist)):
		anomdictlist = []
		currdict = {}
		currx = int(anomlist[i][0])
		curry = int(anomlist[i][1])
		level = int(anomlist[i][2])
		anomaly = int(anomlist[i][3])
		dict1 = {}
		dict2 = {}
		dict3 = {}
		dict4 = {}
		#We will zoom in one level to get the four corners of the box
		dict1['level'] = level+5
		dict1['x'] = 32*currx
		dict1['y'] = 32*curry
		anomdictlist.append(dict1)
		dict2['level'] = level+5
		dict2['x'] = 32*currx
		dict2['y'] = (curry+1)*32
		anomdictlist.append(dict2)
		dict3['level'] = level+5
		dict3['x'] = (currx+1)*32
		dict3['y'] = (curry+1)*32
		anomdictlist.append(dict3)
		dict4['level'] = level+5
		dict4['x'] = (currx+1)*32
		dict4['y'] = 32*curry
		anomdictlist.append(dict4)

		currdict['tileSelection'] = anomdictlist
		currdict['name'] = "anomaly" + str(i+1)

		latlon = main.convertCoords(currx, curry, level)    
		geo = [latlon[0],latlon[1]]
		currdict['geoCenter'] = geo
		currdict['zoomLevel'] = level-1
		currdict['resolution'] = 7
		currdict['description'] = "anomaly"
		tsdict = {}
		tzdict = {}

		tsdict['endMilli'] = None
		tsdict['startMilli'] = None
		currdict['timeSelect'] = tsdict
		currdict['timeZoom'] = tsdict
		jsonlist.append(currdict)


	print json.dumps(jsonlist) 

		#print anomdictlist
		#print currx
		#print curry
		#print level
		#print anomaly



	if timebucket == "s":
		secondsperbin = 1

	elif timebucket == "m":
		secondsperbin = 60

	elif timebucket == "h":
		secondsperbin = 60*60

	elif timebucket == "d":
		secondsperbin = 60*60*24





	

except SystemExit:
    pass
except:
    print "Exception"
    print sys.exc_info()