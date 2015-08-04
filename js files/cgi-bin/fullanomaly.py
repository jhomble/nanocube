#!python2
import sys, json, platform, os, urllib, time
from traversal import main
import cgitb
import datetime
from copy import deepcopy
cgitb.enable()
#print the header
print "Content-Type: text/plain\n\n",

try:
	# load input
	jsonIn = json.load(sys.stdin)
	# variables from features.js
	port = jsonIn['portnum']
	timestart = jsonIn['timestart']
	numtimebins = jsonIn['numtimebins']

	minlevel = jsonIn['minlevel']
	maxlevel = jsonIn['maxlevel']
	threshold = float(jsonIn['stdev'])
	# time bucket math
	url = "http://nanocube.govspc.att.com:"+port+"/schema"
	response = urllib.urlopen(url)
	data = json.loads(response.read())
	timestring = data['metadata'][0]['value']
	timestringstrp = timestring[0:19]
	timebucket = timestring[len(timestring)-1]
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
	else:
		secondsperbin = 60*60*24
		msecondsperbin = 1000*60*60*24

	histograms = jsonIn['histograms']
	eventTypes = jsonIn['eventTypes']
	newhist = deepcopy(histograms)

	#Need to convert the histograms dictionary to the values that will be queried
	if (histograms != None):
		keys  = histograms.keys()
		for i in range(0, len(histograms)):
			for j in range(0, len(histograms[keys[i]])):
				currindex = eventTypes.index(histograms[keys[i]][j])
				newhist[keys[i]][j] = currindex
	#This url is for getting the start/end time bin information
	url  = "http://nanocube.govspc.att.com:" + port + "/tquery"
	#default, change to user defined eventually
	group_size = int(jsonIn['groupsize'])
	#get the selected time series or the full time series if none selected
	if(jsonIn['numtimebins'] == None):
		if( jsonIn['timeSelect']['startMilli'] != None ):
			tselectstart = long(jsonIn['timeSelect']['startMilli'])
			tselectend = long(jsonIn['timeSelect']['endMilli'])
			te = tselectend - tselectstart
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
	# run algorithm  - output: list of anomalies
	anomlist = main.fullAnomaly(port, starting_bucket, group_size, window, minlevel, maxlevel, newhist, threshold)
	#print anomlist
	jsonlist = []
	# add info to each anomaly so it can be described and seen in gui
	for i in range(0, len(anomlist)):
		anomdictlist = list()
		currdict = dict()
		currx = int(anomlist[i][0])
		curry = int(anomlist[i][1])
		level = int(anomlist[i][2])
		anomaly = int(anomlist[i][3])

		dict1 = dict()
		dict2 = dict()
		dict3 = dict()
		dict4 = dict()
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
		# use this name to get the run number
		# anomdict['name'] = jsonIn['feature']['name'] + "anomaly" + str(i+1)

		latlon = main.convertCoords(currx, curry, level)    
		geo = [latlon[0],latlon[1]]
		currdict['geoCenter'] = geo
		currdict['zoomLevel'] = level-1
		currdict['resolution'] = 7
		currdict['description'] = "anomaly at level" + str(level) 
		currentTime = FIRSTDATE + (anomaly*secondsperbin*timebucketmultiplier)
		currdict['timeSelect'] = dict()
		currdict['timeZoom'] = dict()
		currdict['timeSelect']['startMilli'] = long(currentTime*1000 - msecondsperbin) 
		currdict['timeSelect']['endMilli'] =  long(currentTime*1000 + msecondsperbin)
		currdict['timeZoom']['startMilli'] = None
		currdict['timeZoom']['endMilli'] = None
		currdict['histograms'] = jsonIn['histograms']
		# add it to the output
		jsonlist.append(currdict)

	# like returning from python to js
	print json.dumps(jsonlist)

	#if it is not windows it will not work
	if platform.system() != "Windows":
		#platform is linux
		print os.getcwd()
		print "Failure"
	

except SystemExit:
	pass
except:
	print "Exception"
	print sys.exc_info()