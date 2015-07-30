import urllib, json, Queue, math
import sys
import traversal
import urlmakers

class coord:
	def __init__(self, x, y, z):
		self.x = x
		self.y = y
		self.z = z

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

def boxAnomaly(x1, x2, y1, y2, z, port , tstart, tend):
	coords = (x1, x2, y1, y2, z)
	if x2 - x1 > 4 and y2 - y1 > 4:
		minSplit = 2
	else:
		minSplit = 0
	anomlist = traversal.runSelectedMap(coords, minSplit, port , tstart, tend)
	return anomlist
<<<<<<< HEAD

################################################################################################


def polygonAnomaly(coordlist, port, tstart, tend):
	
	anomalies = traversal.runPolygonSelection(coordlist, port, tstart, tend)
	return anomalies


################################################################################################


=======
################################################################################################

>>>>>>> 8ef420e5da43ed74e83377be5059d8fb248340ae
def fullAnomaly(port, timestart, timeend, minlevel, maxlevel):
	#print "got into main fullanomaly"
	a = traversal.initializeEntireMap(int(minlevel), int(maxlevel), port, timestart, timeend)
	#print "did traversal initialize"
	return a

# Main function
# First initialze the queue
# Process all entries in the queue until empty
if __name__ == '__main__':

	if len(sys.argv) == 1:
		traversal.initializeEntireMap(2, 12)
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
	

