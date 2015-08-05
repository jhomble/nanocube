USING NANOCUBE ANOMALY DETECTION

Authors: 2015 Summer Interns: Matthew Lipshultz, Julien Homble, Andrew Cleary


#############################################################################
Intro

For setup instructions please refer to SETUP_README.MD

Once setup is complete you can run in browser using the gui or from the command line.

#############################################################################
FROM GUI

You will see one or more new buttons on your gui including the Anomaly Detector button, along with the buttons just like in the feature function for saving and deleting.

The Anomaly Detector Button:
-This button is where the magic happens


1.First select which type of anomaly detection you want to use
-Full takes the entire map and runs the algorithim on it
-Region needs a rectanglular selection region to zoom in or a polygon to run the time series anomaly detection on that entire polygon.


2.The Settings Button is different for full and region

Full: 
-Max Lvl is the maximum you will zoom in to find anomalies, this tells the algorithm when to stop zooming further.
-Min Lvl is the minimum times the world will be split to search for anomalies ,even if the previous level had no anomalies, to start zooming in to pinpoint them. (ex 7,200 miles will split the world into 7,200 mile square cubes, search each for anomalies and begin zooming in from there)
-Std Dev specifies the threshold of the time series anomaly detection, how many standard deviations away from the mean the anomaly must be at least. (ex lower will find more anomalies but their counts are less standard deviations away from the mean, and higher will find less anomalies but their counts are more standard deviations away from the mean.)
-Click the Save Settings button after editing Settings

Region:
-Min Splits specifies how many times will the region be split into 4 equal smaller regions, (ex 0 will take the selected region split it 0 times and run the time series anomaly detection on the entire selected region)
-Std Dev specifies the threshold of the time series anomaly detection, how many standard deviations away from the mean the anomaly must be at least. Higher means less anomalies.
-Click the Save Settings button after editing Settings


3.The Run Button

After selecting full or region, and setting and saving settings, you are ready to run.
You can also highlight time windows and select cetegories to search those areas exclusivly, but it is slow(alot of counting)

Click the Run Button to run. In the event it is taking too long (>3 minutes), kill and rerun the HTTPServer and reload the page.

4.The Anomaly List Button

-After running the anomaly list will be populated with anomalies.

-Highlight each one to highlight and zoom in onto the location on the map of the anomaly.

-To rename it click the Edit Anomaly Button and you can give it a name and description.

-To save it click the Save Anomaly Button and it will save on the features list "Saved Points of Interest" accessed by clicking on the folder icon, and it also saves on the file features_list.js.

-To delete it from that list and the features_list.js highlight it and click the trash can.

#############################################################################
FROM COMMAND LINE

Start a ncserver.
Run the file cmdmain.py with command line arguments:

python cmdmain.py type_of_anomaly port bin_start group_size num_groups minlevel maxlevel stdevmult

CmdLine Arg         Description

type_of_anomaly-    -f for full or -r for region or -h for help

Full anomaly:
port-               the port # of the ncserver
bin_start-          the starting bin
group_size-         the # of time bins in each group (we set it to 1)
num_groups-         the # of groups in the query
minlevel-           the minimum times the world will be split to search for anomalies
maxlevel-           the maximum you will zoom in to find anomalies
stdevmult-          the # of standard deviations away from the mean the timebin must be at least to be an anomaly

