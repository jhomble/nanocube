## # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # ## 
## # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # ## 
##                                                                                                             ##
## Anomaly Detection Traversal                                                                                 ##
##                                                                                                             ##
## Authors:                                                                                                    ##
## Julien Homble, Matthew Lipshultz, Andrew Clearly                                                            ##
##                                                                                                             ##
## Dependencies:                                                                                               ##
## main.py                                                                                                     ##
## urlmakers.py                                                                                                ##
## anomalyDetection.py                                                                                         ##
##                                                                                                             ##
## Purpose:                                                                                                    ##
## Given parameters determining minimum and maximum levels of depth search in the nanocube quad tree,          ##
##	this file creates ques to process url requests created by urlmakers.py. After determmining which           ##
##  sections of the nanocube quad tree to retrieve, it uses the anomalyDetection.py file to determine          ##
##	whether the section processed contained an anomaly. After repeating this process until all anomalies       ##
## 	had been found, it returns a list of anomalies with the coordinates and anomaly information.               ##
##                                                                                                             ##
## Step by Step Process:                                                                                       ##
## Full Detection:                                                                                             ##
## 	Starting with initializeEntireMap, put the (0,0,0) square (the entire map) into an initial Q.              ##
## 	The ques process a section of the nano cube quad tree. For example, (0,0,1) is now the                     ##
## 	bottom left quadrent of the entire map and (1,1,1) is the top left quadrent. Through the                   ##
## 	nano cube server, the program can send url requests to get counts of these sections of the map.            ##
## 	By retreiving these counts, we can run an anomaly detection algorithim which can determine whether         ##
## 	or not an anomaly was found in that region. If found, drill deeper in that square and add its              ##
##	quadrents into the que for further processing.                                                             ##
## 	Process this first square searching for anomalies until the minimum level is reached. This will find       ##
## 	high level anomalies (Worldwide/country anomalies). Once the first inital que is done running              ##
## 	(I will explain later how the ques are processed), add all squares at the minimum level to the que.        ##
##	(this is the starting level to find anomalies, the first inital que is purely for finding high             ##
##	level anomalies. But even if they were found, we will search over them again at a more specific level).    ##
## 	Once that level is put in the que, run the que until it becomes empty and return the anomaly list.         ##
##                                                                                                             ##
## 	How the que is processed:                                                                                  ##
##		The que is loaded with tuples of a coord objects which contain an (x,y,z) which can specify a square   ##
##  	on the quad tree. Along with the location of the box, each que has a list of anomalies. This list      ##
##		is a record of anomalies that were found in the square. Depending on where or if we find the anomaly   ##
## 		again in the square's quadrents will determine how we add more ques or report the anomaly              ##
##																											   ##
##      processSquare: 																						   ##
##			This function is where each que is first processed.                                                ##
##			First, take the sqaure given by the coords parameter (coord object) and run checkCorners on 	   ##
## 			the 4 quadrents of the square (to retreive the quadrents, its as simple as multiplying the         ##
##			original square's coordinates by 2 and adding 1 to corresponding corners). 						   ##
##                                                                                                             ##
##				checkCorners:																		 	       ##
##					Given the x,y,z coordinates of a box, create a URL by calling urlMaker in urlmakers.py     ##
##					Send that url to processURL in urlmakers.py, which returns a dictionary of time bins and   ##
##						and their counts.             														   ##
##					Using this dictionary, send that data to anomalyDetection in anomalyDetection.py           ##
##						Here is where a time series anomaly detection algorithim should be set.                ##
##						Given time bins and their counts, the function should return a list of anomalies       ##
##						Inside this list should be the time bins from that sqaure that had anomalies           ##
##																											   ##
##			Now, each of the 4 quardrents of the square being processed has a list of the anomalies found.     ##
##			Add all the anomalies from each quadrent into a group list --> found[]                             ##
## 			Run a loop on all the anomalies given by the parameter listQ. This list was the anomalies suppose  ##
## 			to be found in the original square. 															   ##
##			In this loop, check if the anomaly in ListQ was found in the found[] list and how many times.      ##
##			If the anomaly was found only 1 time and the maximum depth search has not be reached, do nothing   ##
##			at this step (the anomaly will continue to be searched by adding the quadrent the anomaly was 	   ##
##			found in into the que). If the anomaly was not found, this means that the anomaly was found on     ##
## 			a higher depth level but no longer found. As a result, report the anomaly on the location and 	   ##
##			depth of the original square where it was last found. The last case being the anomaly was found    ##
## 			more than once. This means that the anomaly was found only once on the original square but split   ##
##			when looking at its quadrents. To report this anomaly, we determined it would be best to record    ##
## 			the anomaly at the original square to reduce duplicate anomalies. 								   ##
##																										       ##
##			To report an anomaly we add its location (x,y,z) and the timebin that it occured in to a global    ##
##			list --> anomlist2 which will be returned at the very end of the entire process                    ##
##			If we reported an anomaly, we remove the anomaly from the quadrents so that after reporting it,    ##
##   		the traversal does not continue to look for it wasting time and creating dupliucates. 			   ##
## 																											   ##
##			Once all anomalies from the listQ have been checked and the anoalies that have been reported have  ##
##			been removed from the quadrents, it's time to update the que with any new anomalies found or 	   ##
##			anomalies that can be searched better. 															   ##
##																											   ##
##  		For each list of anomalies (top right, top left, bottom right, bottom left), check to see whhether ##
##			or not they are empty. If they are empty, do nothing, or if the max depth level has been reached,  ##
##			do nothing. Otherwise, add all anomalies in the list (the contents of the list are timebins), into ##
##			the que along with the coordinates (x,y,z) of the quadrent iteself. 							   ##
##																											   ##
##			At this point, the process is repeated. The que processes each element until it is empty and       ##
##			within each process, anomalies are found, reported, and added to the que.                          ##
##                                                                                                             ##
##                                                                                                             ##
##	Region Detection:																						   ##
##		newrunSelected: This function starts by converting the coordinates to the same box 5 levels deeper 	   ##																				
##		than the current level. This is to done to ensure the box can be split into quadrants multiple times.  ##
##      The first box is put onto the queue to be processed. Then the newproccessSelected function is run on   ##																								   
##		the queue until it is empty. The parameter minSplits, which the user will define in the GUI,           ##																								   
##      determines how many times the inital box will be split into quadrants. For example, a minSplit of 1    ##                                                                                             	   
##      will divide the box into 4 quadrants, a minSplit of 2 will make 16 boxes from the original box and so  ##
##		on. The boxes are placed in the queue with their current level (the initial box would have level 0)    ##	
##		and this current level will update the global current level. When the current level exceeds the 	   ## 	
##		value of minSplits, then nothing else will be added to the queue. besides this, the queue is processed ##
##		the same way as it is in full anomaly but now a query is sent with the corners of the boxes to be      ##  
##      checked.                                                                                               ##
##                                                                                                             ##
## # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # ## 
## # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # ## 

import urllib, json, Queue, math
import urlmakers
import anomalyDetection

# Global Variables

anomlist1 = []					# Final anomaly list for region detection
anomlist2 = []                  # Final anomaly list for full dectection
q = Queue.Queue()				# Main que for processing
initQ = Queue.Queue()           # Initial que for full dectection high level anomalies
splits = 0						# Records how many times the selected box in region anomaly was split
currentlevel = 0				# Records the current depth level when using region detection

################################################################################################
# Class for holding coordinates
class coord:
	def __init__(self, x, y, z):
		self.x = x
		self.y = y
		self.z = z

################################################################################################
# Region deteciton processing 
# Anomalies are searched for at the selected square, but 5 levels deeper than when the user
# first selected to have a better approximations of what boxes were selected (when using the draw tool, 
# coordinated for the corners are returned, and when a url request from those corners are sent, it actually
# returns the boxes within the coordinates are selected so the selected area is just an approximation).
# To retreive more anomailes on a smaller level in the selected box, split the box into 4 quadrents and run
# the same anomaly traversal algorithim as the full detection but instead of working with perfect boxes
# that the nanocube recognizes, use 4 coordinates and approximate the boxes.
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
			if found.count(anomaly) != 1 or (currentlevel == minSplits and found.count(anomaly) != 0):
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
# Given the quadrent of a selected area, create the url and process it 
# by sending the formatted data to anomalyDetection which returns a list of anomalies
def checkSelectedCorners(x1, x2, y1, y2, z):

	anomaly = []
	url = urlmakers.urlBoxMaker(x1, x2, y1, y2, z, histogramglob)
	#print url
	try:
		data = urlmakers.processURL(url)
		anomaly = anomalyDetection.anomalyDetector(data)
	except ValueError:
		pass
		
	return anomaly

################################################################################################	
# Given the coordinates of a selected box, 
# Returned is the array of boxes containing the 4 corners of the corressponding corners	
def calculateBoxes(x1, x2, y1, y2, z):

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
		if(found.count(anomaly) != 1 or (coords.z == maxLevel and found.count(anomaly) != 0)):
			if not init:
				latlong = convertCoords(coords.x, coords.y, coords.z)
				anomlist2.append((coords.x, coords.y, coords.z, anomaly))
				#print "anomaly at " + str(coords.x) + ", " + str(coords.y) + ", " + str(coords.z) + " : " + str(anomaly) + " corresponding to " + str(latlong[0]) + ", " + str(latlong[1])
			else: 
				latlong = convertCoords(coords.x, coords.y, coords.z)
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
		anomaly = anomalyDetection.anomalyDetector(data)
	except ValueError:
		pass
	#BOOLEAN T/F based if anamoly found
	
	return anomaly

################################################################################################
# Run the anomaly detection/traversal on the entire map
# First run an initial que to report all high level anomalies. This is done in runEntireMap
# After, add all squares 1 level up from the minlevel to the que and process everything until the que is empty.
# Return anomlist2 which is a global list that kept track of all anomalies found
def initializeEntireMap(minLevel, maxLevel, histogram):
	
	global histogramglob
	histogramglob = histogram

	runEntireMap(minLevel)
	init = False
	for i in range(0,int(math.pow(2,minLevel+1))):
		for j in range(0,int(math.pow(2,minLevel+1))):
			coords = coord(i,j,minLevel + 1)
			q.put((coords,[]))
	while not q.empty():
		bufferQ = q.get()
		processSquare(bufferQ[0], bufferQ[1], maxLevel, init)

	return anomlist2	

################################################################################################
# Reports high level anomalies
# Add the first square (0,0,0) to the inital que
# Process that square and run the detection up to the specified min value
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
# Start of region detection. 
# Given the coordinates of a box, drill down 5 levels while retaining the same box to retreive
# a more accurate box and to be sure we can split the box.
# Once the box is made, add its coordinates and an empty list to the que and process it.
# After the que is done running, return the anomlist1 which is a global list that kept track of anomalies
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

################################################################################################
# Given a polygon as the region selected, as of now there is no good way to drill down and 
# search for anomalies. Instead, just run the anomaly detection time series algorithim
# on the entire polygon and return the result.
def runPolygonSelection(coordslist, histogram):

	global histogramglob
	histogramglob = histogram

	url = urlmakers.urlPolygonMaker(coordslist, histogram)
	#print url
	anomaly = []
	try:
		pass
		data = urlmakers.processURL(url)
		anomaly = anomalyDetection.anomalyDetector(data)
	except ValueError:
		pass
	#print anomaly

	return anomaly

################################################################################################

# This function converts a box's coordinate's to latitude and longitude
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