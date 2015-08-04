import urllib, json, Queue, math
import urlmakers
import anamolyDetection
import main 
from main import coord

anomlist1 = []
anomlist2 = []
q = Queue.Queue()
initQ = Queue.Queue()
selectedQ = Queue.Queue()
splits = 0
currentlevel = 1



def newprocessSelected(coords, listQ, currlev, minSplits):
	global currentlevel
	if (currlev > currentlevel):
		currentlevel += 1

	if (currentlevel <= minSplits):
		boxes = calculateBoxes(coords[0], coords[1], coords[2], coords[3], coords[4])
		# Check Top Right
		TR = checkSelectedCorners((boxes[0])[0], (boxes[0])[1], (boxes[0])[2], (boxes[0])[3], (boxes[0])[4])
		# Check Top Left
		TL = checkSelectedCorners((boxes[1])[0], (boxes[1])[1], (boxes[1])[2], (boxes[1])[3], (boxes[1])[4])
		# Check Bottom Right
		BR = checkSelectedCorners((boxes[2])[0], (boxes[2])[1], (boxes[2])[2], (boxes[2])[3], (boxes[2])[4])
		# Check Bottom Left
		BL = checkSelectedCorners((boxes[3])[0], (boxes[3])[1], (boxes[3])[2], (boxes[3])[3], (boxes[3])[4])
		found = TL + TR + BR + BL
		while len(listQ) != 0:
			anomaly = listQ.pop(0)
			if found.count(anomaly) != 1:
				#print "anomaly at " + str(coords[0]) + ", " + str(coords[1]) + ", " + str(coords[2]) + ", " + str(coords[3]) + ", " + str(coords[4]) + " : " + str(anomaly) 
				anomlist1.append((coords[0], coords[1], coords[2], coords[3], coords[4], anomaly))
				while TR.count(anomaly) != 0:
					TR.remove(anomaly)
				while TL.count(anomaly) != 0:
					TL.remove(anomaly)
				while BR.count(anomaly) != 0:
					BR.remove(anomaly)
				while BL.count(anomaly) != 0:
					BL.remove(anomaly)

		quad = ((boxes[0])[0], (boxes[0])[1], (boxes[0])[2], (boxes[0])[3], (boxes[0])[4])                           
		q.put((quad,TR, currentlevel+1))
		quad = ((boxes[1])[0], (boxes[1])[1], (boxes[1])[2], (boxes[1])[3], (boxes[1])[4])
		q.put((quad,TL, currentlevel+1))			
		quad = ((boxes[2])[0], (boxes[2])[1], (boxes[2])[2], (boxes[2])[3], (boxes[2])[4])
		q.put((quad,BR, currentlevel+1))
		quad = ((boxes[3])[0], (boxes[3])[1], (boxes[3])[2], (boxes[3])[3], (boxes[3])[4])
		q.put((quad,BL, currentlevel+1))

################################################################################################
# The selected box does not zoom in any further levels, just making smaller boxes on the level it is started on
def processSelected(coords, listQ, minSplits):
	found = []
	boxes = calculateBoxes(coords[0], coords[1], coords[2], coords[3], coords[4])

	# Check Top Right
	TR = checkSelectedCorners((boxes[0])[0], (boxes[0])[1], (boxes[0])[2], (boxes[0])[3], (boxes[0])[4])
	# Check Top Left
	TL = checkSelectedCorners((boxes[1])[0], (boxes[1])[1], (boxes[1])[2], (boxes[1])[3], (boxes[1])[4])
	# Check Bottom Right
	BR = checkSelectedCorners((boxes[2])[0], (boxes[2])[1], (boxes[2])[2], (boxes[2])[3], (boxes[2])[4])
	# Check Bottom Left
	BL = checkSelectedCorners((boxes[3])[0], (boxes[3])[1], (boxes[3])[2], (boxes[3])[3], (boxes[3])[4])
	found = TL + TR + BR + BL
	while len(listQ) != 0:
		anomaly = listQ.pop(0)
		if found.count(anomaly) != 1:
			#print "anomaly at " + str(coords[0]) + ", " + str(coords[1]) + ", " + str(coords[2]) + ", " + str(coords[3]) + ", " + str(coords[4]) + " : " + str(anomaly) 
			anomlist1.append((coords[0], coords[1], coords[2], coords[3], coords[4], anomaly))
			while TR.count(anomaly) != 0:
				TR.remove(anomaly)
			while TL.count(anomaly) != 0:
				TL.remove(anomaly)
			while BR.count(anomaly) != 0:
				BR.remove(anomaly)
			while BL.count(anomaly) != 0:
				BL.remove(anomaly)

	if (TR and (coords[1] - coords[0]) > 1 and (coords[3] - coords[2]) > 1) or splits < minSplits:
		quad = ((boxes[0])[0], (boxes[0])[1], (boxes[0])[2], (boxes[0])[3], (boxes[0])[4])                           
		q.put((quad,TR))
	if (TL and (coords[1] - coords[0]) > 1 and (coords[3] - coords[2]) > 1) or splits < minSplits:
		quad = ((boxes[1])[0], (boxes[1])[1], (boxes[1])[2], (boxes[1])[3], (boxes[1])[4])
		q.put((quad,TL))
	if (BR and (coords[1] - coords[0]) > 1 and (coords[3] - coords[2]) > 1) or splits < minSplits:
		quad = ((boxes[2])[0], (boxes[2])[1], (boxes[2])[2], (boxes[2])[3], (boxes[2])[4])
		q.put((quad,BR))
	if (BL and (coords[1] - coords[0]) > 1 and (coords[3] - coords[2]) > 1) or splits < minSplits:
		quad = ((boxes[3])[0], (boxes[3])[1], (boxes[3])[2], (boxes[3])[3], (boxes[3])[4])
		q.put((quad,BL))

################################################################################################
# Given the quadrent of a selected area, create the url and process it
def checkSelectedCorners(x1, x2, y1, y2, z):
	print "hi"
	anomaly = []
	url = urlmakers.urlBoxMaker(x1, x2, y1, y2, z, histogramglob)
	#print url
	try:
		print "hi"
		data = urlmakers.processURL(url)
		print data
		anomaly = anamolyDetection.anomalyDetector(data)
	except ValueError:
		pass
		
	
	return anomaly

################################################################################################	
# Given the coordinates of a selected box, 
# Returned is the array of boxes containing the 4 corners of the corressponding corners	
def calculateBoxes(x1, x2, y1, y2, z):
	#if (x1 - x2) % 2 != 0 or (y1 - y2) % 2 != 0:
	#	x1 = x1 * 2 
	#	x2 = x2 * 2
	#	y1 = y1 * 2
	#	y2 = y2 * 2
	#	z = z + 1

	newx2 = x1 + ((x2-x1)/2)
	newy2 = y1 + ((y2-y1)/2)
	TR = (newx2, x2, newy2, y2, z)
	TL = (x1, newx2, newy2, y2, z)
	BR = (newx2, x2, y1, newy2, z)
	BL = (x1, newx2, y1, newy2, z)
	global splits
	splits = splits + 1
	
	return [TR, TL, BR, BL]

################################################################################################
# Process an entry of the queue
# Given the coordinates of a box on the map, retrieve all found anomalies in it's quadrents/corners
# Once all anomalies are found, search the found anomalies with the list of anomalies previously found
# If the anomaly suppose to be found did not come up or appeared multiple times, 
# the anomaly should be reported by the box and should be removed from the indiviual corners list
# After all anomalies in the previously found list are searched in the found anomlies list,
# if there were any remaining anomalies in the individual corners (either new anomalies or a 
# previously found anomaly was found only once), enqueue the corner with its coordinates and list of anomalies.
def processSquare(coords, listQ, maxLevel, init):

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
				latlong = main.convertCoords(coords.x, coords.y, coords.z)
				anomlist2.append((coords.x, coords.y, coords.z, anomaly))
				#print "anomaly at " + str(coords.x) + ", " + str(coords.y) + ", " + str(coords.z) + " : " + str(anomaly) + " corresponding to " + str(latlong[0]) + ", " + str(latlong[1])
			else: 
				latlong = main.convertCoords(coords.x, coords.y, coords.z)
				anomlist2.append((coords.x, coords.y, coords.z, anomaly))
				#print "high level anomaly found at " + str(coords.x) + ", " + str(coords.y) + ", " + str(coords.z) + " : " + str(anomaly) + " corresponding to " + str(latlong[0]) + ", " + str(latlong[1])
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

# Given x,y,z coordinates of a box, retreive the JSON of the information of the box 
# Pass in the data of the box to an anomaly detector and return the results of he anomalies
def checkCorners(x, y, z):
	anomaly = []
	url = urlmakers.urlMaker(x, y, z, histogramglob)

	try:
		data = urlmakers.processURL(url)
		anomaly = anamolyDetection.anomalyDetector(data)
	except ValueError:
		pass
	#BOOLEAN T/F based if anamoly found
	
	return anomaly

################################################################################################
# Run the anomaly detection/traversal on the entire map
def initializeEntireMap(minLevel, maxLevel, histogram):
	
	global histogramglob
	histogramglob = histogram

	runEntireMap(minLevel)
	init = False
	for i in range(0,int(math.pow(2,3))):
		for j in range(0,int(math.pow(2,3))):
			coords = coord(i,j,3)
			q.put((coords,[]))
	while not q.empty():
		bufferQ = q.get()
		processSquare(bufferQ[0], bufferQ[1], maxLevel, init)

	return anomlist2	

################################################################################################
# Reports high level anomalies
# Adds all other anomalies up to a given value to the queue to further process
def runEntireMap(minLevel):
	init = True
	listQ = []
	quad = coord(0,0,0)
	# initQ is a seperate queue designed specifically and only for initialzing and retreiving large anomalies
	initQ.put((quad,listQ))
	while not initQ.empty():
		bufferQ = initQ.get()
		processSquare(bufferQ[0], bufferQ[1], minLevel, init)



################################################################################################
# Run the anomaly detection/traversal on the selected coordinates
#def initializeSelectedMap(coords, maxLevel):
#	runSelectedMap(coords, minLevel)

################################################################################################
# Run the the initial que for the selected map
def runSelectedMap(coords, minSplit, histogram):

	global histogramglob
	histogramglob = histogram

	init = True
	listQ = []
	q.put((coords, listQ))
	while not q.empty():
		bufferQ = q.get()
		processSelected(bufferQ[0], bufferQ[1], minSplit)
		#print anomlist1
	return anomlist1

def newrunSelected(coords, minSplit, histogram):
	global histogramglob
	histogramglob = histogram
	
	newx1 = 32*(coords[0])
	newx2 = 32*(coords[1])
	newy1 = 32*(coords[2])
	newy2 = 32*(coords[3])
	newlevel = 5+coords[4]
	newcoords = (newx1, newx2, newy1, newy2, newlevel)
	listQ = []
	q.put((coords, listQ, 0))
	while not q.empty():
		bufferQ = q.get()
		newprocessSelected(bufferQ[0], bufferQ[1], bufferQ[2], minSplit)

	return anomlist1


def runPolygonSelection(coordslist, histogram):

	global histogramglob
	histogramglob = histogram

	url = urlmakers.urlPolygonMaker(coordslist, histogram)
	#print url
	anomaly = []
	try:
		pass
		data = urlmakers.processURL(url)
		anomaly = anamolyDetection.anomalyDetector(data)
	except ValueError:
		pass
	#print anomaly

	return anomaly
