import urllib, json, Queue, math
import pandas as pd
import numpy as np
from pandas import Series, DataFrame

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
