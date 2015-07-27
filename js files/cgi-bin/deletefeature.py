#!/usr/bin/python

import sys, json, platform, os

#print the header
print "Content-Type: text/plain\n\n",

try:
    # print os.getcwd();
    jsonIn = json.load(sys.stdin)
    path = jsonIn["path"]
    
    if platform.system() == "Windows": #for development
        path = ""
    else:
        path = "/var/www/html" + path + "/"
        
    name = jsonIn["name"]
    with open(path + "feature_list.js", "r") as fin:
        serverJson = json.loads(fin.read())

    for i in range(0, len(serverJson)):
        if serverJson[i]["name"] == jsonIn["name"]:
            serverJson.pop(i)
            break
    
    with open(path + "feature_list.js", "w") as fout:
        fout.write(json.dumps(serverJson, sort_keys=True, indent=4, separators=(",",": ")))
        
    print "Success"
except SystemExit:
    pass
except:
    print "Exception"
    print sys.exc_info()
    