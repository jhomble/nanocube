import urllib, json, Queue, math
import sys
import traversal
#import urlmakers
#Global string which represents the category query. Global so it only needs to be constructed once
histogramstring = ""
gport = ""
gbinstart = ""
gnumgroups = ""
ggroupsize = ""
gstdevmult = 2.5


################################################################################################

# Function for anomaly detection on a selected region of the map
def boxAnomaly(x1, x2, y1, y2, z, port, bin_start, group_size, num_groups, histogram, stdevmult, minSplit):
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
	coords = (x1, x2, y1, y2, z)

	#anomlist = traversal.runSelectedMap(coords, minSplit, histogram)
	anomlist = traversal.newrunSelected(coords, minSplit, histogram)
	return anomlist

################################################################################################

# Function for anomaly detection if the polygon tool is used for selecting a region
def polygonAnomaly(coordlist, port,  bin_start, group_size, num_groups, histogram, stdevmult):
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
	anomalies = traversal.runPolygonSelection(coordlist, histogram)
	return anomalies

################################################################################################

# Function for full anomaly detection (entire map)
def fullAnomaly(port, bin_start, group_size, num_groups, minlevel, maxlevel,histogram, stdevmult):
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
	a = traversal.initializeEntireMap(int(minlevel), int(maxlevel), histogram)
	return a


def main(args):
	if (args[1] == "-h"):
		print "For region selection use -r. For full anomaly detection use -f."
		print "Full anomaly detection runs anomaly detection on the full map, and region anomaly selection runs anomaly detection on the specified square/rectangle."
		print "Full anomaly detection arguments:"
		print "First argument after the function call is '-f'."
		print "This is followed by (2. port number (3. starting time bin (4. Number of time bins in a group (5. number of groups (6. minimum level of drilldown (7. maximum level of drilldown (8. standard deviation threshold"
		print ""
		print "Region anomaly detection arguments:"
		print "First argument after the function call is '-r'."
		print "This is followed by (2. x1 (3. x2 (4. y1 (5. y2 (6. level of the box (7. port number (8. starting time bin (9. Number of time bins in a group (10. number of groups (11. standard deviation threshold (12. number of times you want the algorithm to split your box"

	elif (args[1] == "-f"):
		if (len(args) == 9):
			port = args[2]
			bin_start = args[3]
			group_size = args[4]
			num_groups = args[5]
			try:
				minlevel = int(args[6])
				maxlevel = int(args[7])
				threshold = float(args[8])
			except:
				print args[6]
				print args[7]
				print args[8]
				print "Invalid arguments: Min level, max level, and the standard deviation threshold should be numbers, for help please use the argument '-h'"
				sys.exit()
			
			try:
				int(port)
				int(bin_start)
				int(group_size)
				int(num_groups)

			except:
				print "Invalid arguments: Port, starting bin, group size, and number of groups should be intergers, for help please use the argument '-h'"
				sys.exit()

			try:
				anom = fullAnomaly(port, bin_start, group_size, num_groups, minlevel, maxlevel, None, threshold)
			
			except:
				print "Anomaly detection failed. Please check your input arguments"
				sys.exit()

			if (len(anom) == 0):
				print "No anomalies found"
			
			else:
				print str(len(anom)) + " anomalies found in full anomaly detection:"
				for i in range(0, len(anom)):
					print "Anomaly at " + str(anom[i][0]) + "," + str(anom[i][0]) + "," + str(anom[i][2]) + " at time bin " + str(anom[i][3])

		else:
			print "Invalid number of arguments, for help please use the argument '-h'"
			sys.exit()

	elif (args[1] == "-r"):
		if (len(args) == 13):
			try:
				x1 = int(args[2])
				x2 = int(args[3])
				y1 = int(args[4])
				y2 = int(args[5])
				level = int(args[6])

			except: 
				print "Invalid arguments: The x and y coordinates of the box and the level must be intergers, for help please use the argument '-h'"
				sys.exit()

			port = args[7]
			bin_start = args[8]
			group_size = args[9]
			num_groups = args[10]

			try:
				int(port)
				int(bin_start)
				int(group_size)
				int(num_groups)

			except:
				print "Invalid arguments: port, starting bin, group size, and number of groups should be intergers, for help please use the argument '-h'"
				sys.exit()

			try:
				threshold = float(args[11])
				minSplit = int(args[12])

			except:
				print "Invalid arguments: The standard deviation threshold must be a float and minimum number of splits must be an integer, for help please use the argument '-h'"
				sys.exit()

			try:
				anom = boxAnomaly(x1, x2, y1, y2, level, port, bin_start, group_size, num_groups, None, threshold, minSplit)

			except:
				print "Anomaly detection failed. Please check your input arguments"
				sys.exit()				

			if (len(anom) == 0):
				print "No anomalies found"
			
			else:
				print str(len(anom)) + " anomalies found in region anomaly detection:"
				for i in range(0, len(anom)):
					print "Anomaly at the box with corners " + str(anom[i][0]) + "," + str(anom[i][1]) + "," + str(anom[i][2]) + "," + str(anom[i][3]) + " at level " + str(anom[i][4]) + " at time bin " + str(anom[i][5])  

		else:
			print "Invalid number of arguments, for help please use the argument '-h'"

	else:
		print "Error: Please use -h for help, -r for region detection, -f for full detection"


# Main function
# There are other functions in this file because the CGI script has to call different functions based on what options 
# were selected in the GUI. Can either be run through the command line or through the GUI
# First initialze the queue
# Process all entries in the queue until empty


	

