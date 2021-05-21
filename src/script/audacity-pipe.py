#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Audacity pipe.
Keep audacity-pipe.py short!!
You can make more complicated longer tests to test other functionality
or to generate screenshots etc in other scripts.
Make sure Audacity is running first and that mod-script-pipe is enabled
before running this script.
Requires Python 2.7 or later. Python 3 is strongly recommended.
"""

import os
import sys
import time
import re

if (len(sys.argv) < 2):
    print("Usage: python audacity-pipe.py <fullpath>")
    sys.exit(-1)
prefs = os.path.join('C:\\Users\\Trihus\\AppData\\Roaming', 'audacity', 'audacity.cfg')
if (not os.path.exists(prefs)):
    print("Please Install Audacity")
    sys.exit(-2)
prefFile = open(prefs, 'r')
prefData = prefFile.read()
prefFile.close()
m = re.search('mod-script-pipe=([01])', prefData)
if (m):
    print("mod-script-pipe value=" + m.group(1))
    if (m.group(1) != '1'):
        print("Enable scripting!")
        sys.exit(-3)

# Check for Audacity running
myProc = 'none'
output = os.popen('wmic process get Description').read()
if (output.find('audacity') < 0):
    # if not running, launch it
    myDir = os.getcwd()
    os.chdir('C:\\Program Files (x86)\\Audacity')
    myProc = os.popen('audacity.exe')
    os.chdir(myDir)
    time.sleep(8)

if sys.platform == 'win32':
    print("pipe-test.py, running on windows")
    TONAME = '//./pipe/ToSrvPipe'
    FROMNAME = '//./pipe/FromSrvPipe'
    EOL = '\r\n\0'
    print("%s environment entries" % len(os.environ))
    # for ln in os.environ:
    #     print ln
else:
    print("pipe-test.py, running on linux or mac")
    TONAME = '/tmp/audacity_script_pipe.to.' + str(os.getuid())
    FROMNAME = '/tmp/audacity_script_pipe.from.' + str(os.getuid())
    EOL = '\n'

print("Write to  \"" + TONAME +"\"")
if not os.path.exists(TONAME):
    print(" ..does not exist.  Ensure Audacity is running with mod-script-pipe.")
    sys.exit(-4)

print("Read from \"" + FROMNAME +"\"")
if not os.path.exists(FROMNAME):
    print(" ..does not exist.  Ensure Audacity is running with mod-script-pipe.")
    sys.exit(-5)

print("-- Both pipes exist.  Good.")

TOFILE = open(TONAME, 'w')
print("-- File to write to has been opened")
FROMFILE = open(FROMNAME, 'rt')
print("-- File to read from has now been opened too\r\n")


def send_command(command):
    """Send a single command."""
    print("Send: >>> \n"+command)
    TOFILE.write(command + EOL)
    TOFILE.flush()

def get_response():
    """Return the command response."""
    result = ''
    line = ''
    while True:
        result += line
        line = FROMFILE.readline()
        if line == '\n' and len(result) > 0:
            break
    return result

def do_command(command):
    """Send one command, and return the response."""
    send_command(command)
    response = get_response()
    print("Rcvd: <<< \n" + response)
    return response

def main():
    """Example list of commands."""
    if (myProc == 'none'):
        do_command('New:')
    do_command('OpenProject2:Filename="' + sys.argv[1] + '"')

main()
