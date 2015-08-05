SETTING UP NANOCUBE ANOMALY DETECTION

Authors: 2015 Summer Interns: Matthew Lipshultz, Julien Homble, Andrew Cleary

#############################################################################

How To Add Anamoly Feature into Another Client ( like GDELT ):

-Copy and replace these files: anomaly.js, features.js, features_list.js, full_anom.js.
Add all the new files in js folder, cgi-bin folder, and css folder into the client

Edits:
-In index.html under the lines:
Line 7: <link rel="stylesheet" href="css/leaflet.css"/>
Line 8: <link rel="stylesheet" href="css/leaflet.draw.css"/>"
Add this on a new line:
<link rel="stylesheet" href="css/bootstrap.min.css">

under lines :
Line 128: <script src="lib/leaflet-src.js"></script>
Line 129: <script src="lib/leaflet.draw-src.js"></script>
Add this on a new line:
<script src="js/bootstrap.min.js"></script>

-In index.html add the lines or uncomment under <!-- extensions --> comment:
Line 143: <!-- extensions -->
<script src="features.js"></script>
<script src="anomaly.js"></script>

-In main.js add global port ( ex. $ var port = "29502" ) in the global variables

-Follow respective How To Run Server and How to Run in Browser below

#############################################################################

How To Run Server w/ CGI Scripts on Windows:

-Start the server using command    $ ncserve --port=<PORT#> < <DMP_FILENAME>
-Go to folder with index.html in windows cmd prompt, type $ python -m CGIHTTPServer <port#>
-Then look at your http://<ipaddress>:<port#>/ and python scripts work now

-If you run into errors try downloading launchwin-1.0.1.6.msi from https://bitbucket.org/vinay.sajip/pylauncher/downloads

#############################################################################

How To Run Server w/ CGI Scripts on Linux:

-Make sure all python cgi files are set permissions to 0775
-Start the server using command    $ ncserve --port=<PORT#> < <DMP_FILENAME>
-Go to folder with index.html in it and run   $ python -m CGIHTTPServer <port#>
-Then look at your http://<ipaddress>:<port#>/ or http://localhost:<port#>/ and done

#############################################################################

How To Run In Browser:

-Make sure you are able to run cgi scripts
-Make sure a server is running and port#
-Change port# in main.js and set globals in anamoly.js to the wanted min and max levels, etc.
-Change anomaly threshold to desired amount in anamolyDetection.py

#############################################################################