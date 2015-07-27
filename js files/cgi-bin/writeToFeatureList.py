import sys, json, platform, os, urllib, time
from traversal import main
import cgitb
cgitb.enable()

print "Content-Type: text/plain\n\n",

jsonIn = json.load(sys.stdin)
with open("feature_list.js", "w") as fout:
    fout.write(json.dumps(jsonIn, sort_keys=True, indent=4, separators=(",",": ")))
