import urllib, json, Queue, math
import sys
import traversal
import urlmakers
#Global string which represents the category query. Global so it only needs to be constructed once
histogramstring = ""
gport = "29502"
gbinstart = "0"
gnumgroups = "9"
ggroupsize = "1"
gstdevmult = 2.5
class coord:
	def __init__(self, x, y, z):
		self.x = x
		self.y = y
		self.z = z

################################################################################################

#This function converts a box's coordinate's to latitude and longitude
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

# Function for anomaly detection on a selected region of the map
def boxAnomaly(x1, x2, y1, y2, z, port , bin_start, group_size, num_groups, histogram):
	global gport
	global gbinstart
	global ggroupsize
	global gnumgroups
	gport = port
	gbinstart = bin_start
	ggroupsize = group_size
	gnumgroups = num_groups

	coords = (x1, x2, y1, y2, z)
	if x2 - x1 > 4 and y2 - y1 > 4:
		minSplit = 3
	else:
		minSplit = 0
	#nomlist = traversal.runSelectedMap(coords, minSplit, histogram)
	anomlist = traversal.newrunSelected(coords, 4, histogram)
	return anomlist

################################################################################################

# Function for anomaly detection if the polygon tool is used for selecting a region
def polygonAnomaly(coordlist, port,  bin_start, group_size, num_groups, histogram):
	global gport
	global gbinstart
	global ggroupsize
	global gnumgroups
	gport = port
	gbinstart = bin_start
	ggroupsize = group_size
	gnumgroups = num_groups
	
	anomalies = traversal.runPolygonSelection(coordlist, histogram)
	return anomalies


################################################################################################

# Function for full anomaly detection (entire map)
def fullAnomaly(port,  bin_start, group_size, num_groups, minlevel, maxlevel,histogram, stdevmult):
	global gport
	global gbinstart
	global ggroupsize
	global gnumgroups
	global gstdevmult
	gport = port
	gbinstart = bin_start
	ggroupsize = group_size
	gnumgroups = num_groups
	gstdevmult = stdevmult
	#print stdev
	a = traversal.initializeEntireMap(int(minlevel), int(maxlevel), histogram)
	return a

# Main function
# There are other functions in this file because the CGI script has to call different functions based on what options 
# were selected in the GUI. Can either be run through the command line or through the GUI
# First initialze the queue
# Process all entries in the queue until empty
if __name__ == '__main__':

	if len(sys.argv) == 1:
		#traversal.initializeEntireMap(2, 12)
		coords = (544, 577, 1170, 1223, 11)

		anom = traversal.newrunSelected(coords, 4, None)
		print anom

	elif len(sys.argv) == 6: 

		x1 = int(sys.argv[1])
		x2 = int(sys.argv[2])
		y1 = int(sys.argv[3])
		y2 = int(sys.argv[4])
		z = int(sys.argv[5])
		
		coords = (x1, x2, y1, y2, z)
		if x2 - x1 > 4 and y2 - y1 > 4:
			minSplit = 2
		else:
			minSplit = 0
		traversal.runSelectedMap(coords, minSplit)
	

