#!/usr/bin/python

import sys, json, platform, os

#print the header
print "Content-Type: text/plain\n\n",

try:
    jsonIn = json.load(sys.stdin)

    if platform.system() == "Windows": #for development
        with open("feature_list.js", "r") as fin:
            serverJson = json.loads(fin.read())

        for feature in serverJson:
            if feature["name"] == jsonIn["name"]:
                print "Exists"
                exit(0)
            
        serverJson.append(jsonIn)
        
        with open("feature_list.js", "w") as fout:
            fout.write(json.dumps(serverJson, sort_keys=True, indent=4, separators=(",",": ")))

    else: #platform is linux
        print os.getcwd();
        print "Failure"

        
    print "Success"
except SystemExit:
    pass
except:
    print "Exception"
    