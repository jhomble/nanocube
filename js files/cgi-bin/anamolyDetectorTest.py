import urllib, json, Queue, math
import pandas as pd
import numpy as np
from pandas import Series, DataFrame
import sys
import urlmakers

q = Queue.Queue()
initQ = Queue.Queue()

class coord:
	def __init__(self, x, y, z):
		self.x = x
		self.y = y
		self.z = z

################################################################################################
# Reports high level anomalies
# Adds all other anomalies up to a given value to the queue to further process
def initialize(minLevel):
	
	init = True
	listQ = []
	quad = coord(0,0,0)
	# initQ is a seperate queue designed specifically and only for initialzing and retreiving large anomalies
	initQ.put((quad,listQ))
	while not initQ.empty():
		bufferQ = initQ.get()
		processNode(bufferQ[0], bufferQ[1], minLevel, init);

################################################################################################
# Given x,y,z coordinates of a box, retreive the JSON of the information of the box 
# Pass in the data of the box to an anomaly detector and return the results of he anomalies
def checkCorners(x, y, z):
	anomaly = []
	url = urlmakers.urlMaker(x, y, z)
	#print url
	try:
		data = processURL(url);
		anomaly = anomalyDetector(data);
	except ValueError:
		pass
		#print "error in processURL"
	#BOOLEAN T/F based if anamoly found
	
	return anomaly

################################################################################################

def anomalyDetector(data):
	# Insert time series detection
	keys = []
	values = []
	for x in range(0, len(data)):
		currhex = (int(data[x]['addr'], 16)) 
		newhex = currhex >> 32
		keys.append(newhex)
		values.append(data[x]['value'])
	#print formatteddata[0]['value']	
	s = Series(values, index = keys)
	std =  s.std()
	mean  = s.mean()
	newS = s[s>(mean+(2.5*std))]
	test = newS.index.tolist()
	return test

################################################################################################
# Process an entry of the queue
# Given the coordinates of a box on the map, retrieve all found anomalies in it's quadrents/corners
# Once all anomalies are found, search the found anomalies with the list of anomalies previously found
# If the anomaly suppose to be found did not come up or appeared multiple times, 
# the anomaly should be reported by the box and should be removed from the indiviual corners list
# After all anomalies in the previously found list are searched in the found anomlies list,
# if there were any remaining anomalies in the individual corners (either new anomalies or a 
# previously found anomaly was found only once), enqueue the corner with its coordinates and list of anomalies.
def processNode(coords, listQ, maxLevel, init):

	found = []
	# Check Top Right
	TR = checkCorners(coords.x * 2 + 1, coords.y * 2 + 1, coords.z + 1)
	# Check Top Left
	TL = checkCorners(coords.x * 2, coords.y * 2 + 1, coords.z + 1)
	# Check Bottom Right
	BR = checkCorners(coords.x * 2 + 1, coords.y * 2, coords.z + 1)
	# Check Bottom Left
	BL = checkCorners(coords.x * 2, coords.y * 2, coords.z + 1)
	found = TL + TR + BR + BL
	while len(listQ) != 0:
		anomaly = listQ.pop(0)
		if(found.count(anomaly) != 1 or coords.z == maxLevel):
			if not init:
				latlong = convertCoords(coords.x, coords.y, coords.z)
				print "anomaly at " + str(coords.x) + ", " + str(coords.y) + ", " + str(coords.z) + " : " + str(anomaly) + " corresponding to " + str(latlong[0]) + ", " + str(latlong[1])
			else: 
				latlong = convertCoords(coords.x, coords.y, coords.z)
				print "high level anomaly found at " + str(coords.x) + ", " + str(coords.y) + ", " + str(coords.z) + " : " + str(anomaly) + " corresponding to " + str(latlong[0]) + ", " + str(latlong[1])
			while TR.count(anomaly) != 0:
				TR.remove(anomaly)
			while TL.count(anomaly) != 0:
				TL.remove(anomaly)
			while BR.count(anomaly) != 0:
				BR.remove(anomaly)
			while BL.count(anomaly) != 0:
				BL.remove(anomaly)
	
	if TR and coords.z < maxLevel:
		quad = coord(coords.x * 2 + 1, coords.y * 2 + 1, coords.z + 1)                              
		if init:
			initQ.put((quad, TR))
		else:
			q.put((quad,TR))
	if TL and coords.z < maxLevel:
		quad = coord(coords.x * 2, coords.y * 2 + 1, coords.z + 1)
		if init:
			initQ.put((quad, TL))
		else:
			q.put((quad,TL))
	if BR and coords.z < maxLevel:
		quad = coord(coords.x * 2 + 1, coords.y * 2, coords.z + 1)
		if init:
			initQ.put((quad, BR))
		else:
			q.put((quad,BR))
	if BL and coords.z < maxLevel:
		quad = coord(coords.x * 2, coords.y * 2, coords.z + 1)
		if init:
			initQ.put((quad, BL))
		else:
			q.put((quad,BL))

################################################################################################

def convertCoords(x, y, level):
	flX = float(x)
	flY = float(y)
	flL = float(level)
	lon = ((flX / (2 ** flL)) * 360) - 180
	ystar = (2 ** flL) - flY - 1
	latstar = math.pi - (2*math.pi * ystar / (2 ** flL))
	lat = (180/math.pi * math.atan(0.5 * (math.exp(latstar) - math.exp(-latstar))))
	return (lat, lon)

################################################################################################

def calculateBoxes(x1, x2, y1, y2, z):
	newx2 = x1+ ((x2-x1)/2)
	newy2 = y1 + ((y2-y1)/2)
	bl = (x1, newx2, y1, newy2, z)
	br = (newx2, x2, y1, newy2, z)
	tl = (x1, newx2, newy2, y2, z)
	tr = (newx2, x2, newy2, y2, z)
	return [bl, br, tl, tr]

################################################################################################
# Main function
# First initialze the queue
# Process all entries in the queue until empty
if __name__ == '__main__':

	x1 = int(sys.argv[1])
	x2 = int(sys.argv[2])
	y1 = int(sys.argv[3])
	y2 = int(sys.argv[4])
	z = int(sys.argv[5])
	
	print (urlmakers.urlBoxMaker(x1, x2, y1, y2, z))
	if (x1 % 2 != 0 or x2 % 2 != 0 or y1 % 2 != 0 or y2 % 2 != 0):
		boxes = calculateBoxes(2*x1, 2*x2, 2*y1, 2*y2, z+1)
		bl = boxes[0]
		br = boxes[1]
		tl = boxes[2]
		tr = boxes[3]
		print (urlmakers.urlBoxMaker(bl[0], bl[1], bl[2], bl[3], bl[4]))
		print (urlmakers.urlBoxMaker(br[0], br[1], br[2], br[3], br[4]))
		print (urlmakers.urlBoxMaker(tl[0], tl[1], tl[2], tl[3], tl[4]))
		print (urlmakers.urlBoxMaker(tr[0], tr[1], tr[2], tr[3], tr[4]))

	#print (urlBoxMaker(392, 530, 1214, 1307, 11))
	# start the detection, initialize begins the que
	#initialize(2);
	#init = False
	#for i in range(0,int(math.pow(2,3))):
	#	for j in range(0,int(math.pow(2,3))):
	#		coords = coord(i,j,3)
	#		q.put((coords,[]))
	#while not q.empty():
	#	bufferQ = q.get()
	#	processNode(bufferQ[0], bufferQ[1], 12, init)

