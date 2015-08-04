import urllib, json, Queue, math
import main
#import pandas as pd
#import numpy as np
#from pandas import Series, DataFrame

def anomalyDetector(data):
	# Insert time series detection
	keys = []
	values = []
	total = 0
	variance = 0
	std = 0
	test = []
	multiplier = main.gstdevmult
	#stdevmult = int(main.gstdevmult)
	#Parsing the json response from the server to get the time buckets and their values
	for x in range(0, len(data)):
		#converting the hex bucket number to a decimal number
		currhex = (int(data[x]['addr'], 16)) 
		newhex = currhex >> 32
		keys.append(newhex)
		values.append(data[x]['value'])
	
	#calculating the mean and standard deviation
	mean = sum(values)/len(values)

	for i in range(0, len(keys)):
		total = total + (mean-values[i])**2
	
	variance = total/len(values)
	std = math.sqrt(variance)

	#This checks if the values were x standard deviations above the mean
	for j in range(0, len(keys)):
		currthresh = mean+(multiplier*std)
		if (values[j] > currthresh):
			test.append(keys[j])
	
	#The following code uses pandas. The above code has the same functionality

	# s = Series(values, index = keys)
	# std =  s.std()
	# mean  = s.mean()
	# newS = s[s>(mean+(2.5*std))]
	# test = newS.index.tolist()

	return test

################################################################################################
