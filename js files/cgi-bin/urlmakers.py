import urllib, json, Queue, math
import main
#builds the url for the query of the selected region using the square tool
def urlBoxMaker(x1, x2, y1, y2, z, histogram):

	base = "http://nanocube.govspc.att.com:"
	base = base + main.gport
	extenstion = '/query/pos='
	base = base + extenstion
	#This adds the four corners of the box to the query
	base  = base + "<qaddr(" + str(x1) + "," + str(y1) + "," + str(z) + "),qaddr(" + str(x1) + "," + str(y2) + "," + str(z) + "),qaddr(" + str(x2) + "," + str(y2) + "," + str(z) + "),qaddr(" + str(x2) + "," + str(y1) + "," + str(z)+ ")>/@time=" + str(main.gbinstart) + ":" + str(main.ggroupsize) + ":" + str(main.gnumgroups)
	
	# If categories are selected they are appended to the current query
	histstring = ""
	if (histogram != None):
		if (main.histogramstring == ""):
			keys = histogram.keys()
			for i in range(0, len(histogram)):
				histstring = "/" + str(keys[i]) + "=<"
				for j in range(0, len(histogram[keys[i]])):
					histstring = histstring + str(histogram[keys[i]][j])
					if (j != (len(histogram[keys[i]])-1)):
						histstring = histstring + ","	
				histstring = histstring + ">"
			main.histogramstring = histstring
	#print base + main.histogramstring
	return base + main.histogramstring

################################################################################################

def urlPolygonMaker(coordList, histogram):

	base = "http://nanocube.govspc.att.com:"
	base = base + main.gport
	extenstion = '/query/pos=<'
	base = base + extenstion
	# adds all the vertices of the polygon to the query
	for i in range(0, len(coordList)):
		if (i == len(coordList)-1):
			base = base + "qaddr(" + str(coordList[i]['x']) + "," + str(coordList[i]['y']) + "," + str(coordList[i]['level']) + ")>/@time=" + str(main.gbinstart) + ":" + str(main.ggroupsize) + ":" + str(main.gnumgroups)
		else:
			base = base + "qaddr(" + str(coordList[i]['x']) + "," + str(coordList[i]['y']) + "," + str(coordList[i]['level']) + "),"

	# If categories are selected they are appended to the current query
	histstring = ""
	if (histogram != None):

		if (main.histogramstring == ""):
			keys = histogram.keys()

			for i in range(0, len(histogram)):
				histstring = "/" + str(keys[i]) + "=<"

				for j in range(0, len(histogram[keys[i]])):
					histstring = histstring + str(histogram[keys[i]][j])
					if (j != (len(histogram[keys[i]])-1)):
						histstring = histstring + ","	
			
				histstring = histstring + ">"

			main.histogramstring = histstring

	return base

################################################################################################
# Given x,y,z coordinates of a box, formats the url to request the JSON
def urlMaker(x, y, z, histogram):
	base = "http://nanocube.govspc.att.com:"
	base = base + main.gport
	extenstion = '/query/pos='
	base = base + extenstion
	histstring = ""
	# Adding the current box to the query
	base = base + "qaddr(" + str(x) + "," + str(y) + "," + str(z) + ")/@time=" + str(main.gbinstart) + ":" + str(main.ggroupsize) + ":" + str(main.gnumgroups)
	# If categories are selected they are appended to the current query
	if (histogram != None):
		if (main.histogramstring == ""):
			keys = histogram.keys()
			for i in range(0, len(histogram)):
				histstring = "/" + str(keys[i]) + "=<"
				for j in range(0, len(histogram[keys[i]])):
					histstring = histstring + str(histogram[keys[i]][j])
					if (j != (len(histogram[keys[i]])-1)):
						histstring = histstring + ","	
				histstring = histstring + ">"
			main.histogramstring = histstring
	
	#print base + main.histogramstring
	return base + main.histogramstring

################################################################################################
# Given a url, sends the request and receives the JSON file.
# Format the JSON to retreive an array of {key, val}s 
def processURL(url):

	response = urllib.urlopen(url);
	data = json.loads(response.read())
	formatteddata = data[['root'][0]]['children']
	return formatteddata
