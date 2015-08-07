# nanocube

2015 AT&T Anomaly detection code

Julien Homble, Matthew Lipshultz, Andrew Cleary

Further information about each file can be found within them
Files that we modified:

js files:

  features.js:
  
    Added a delete button on his select box and edited a few changes on how the list updates and changes. 
    
    Mostly cosmetic or reading/writing to featurelist.js
    
  anomaly.js:
  
    Whole new file for anomaly UI. 
    
    Contains all function calls to python files in cgi-bin regarding anomaly detection.
    
    Contains all UI elements with anomaly detection

cgi-bin:

  anomaly:
  
    needed to run main from cmd prompt
    
  anomalyDetection:
  
    contains time series algorithm. 
    
    as of now it simply reads in the data determines anomalies by standard deviations.
    
    *** change this file for a better time series detection
    
  (CGI SCRIPTS) fullAnomaly/regionAnomaly:
  
    both files function the same just for the according detection type
    
    reads in the string from the website, and parses the neccessary information for the python scripts to
    
      be able to determine attributes of the selection/box the user made
      
  urlmakers:
  
    creates the url requests to the nanocube server
    
  traversal:
  
    this file manages how anomalies are searched for, processing the ques, and sending the correct
    
      information to urlmakers and anaomalyDetection

jhomble7@gmail.com 
