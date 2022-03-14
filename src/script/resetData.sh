#!/bin/bash

if [ -d "${HOME}/.config/audiotext" ]; then
	echo "# Removing .deb user data"
	rm -rf "${HOME}/.config/audiotext"
fi

if [ -d "${HOME}/snap/audiotext/x1/.config/audiotext" ]; then
	echo "# Removing snap user data"
	rm -rf "${HOME}/snap/audiotext/x1/.config/audiotext"
fi

if [ -d "/opt/Audio Text Desktop" ]; then
	echo "# Launching builder Audio Text Desktop"
	"/opt/Audio Text Desktop Extension/audiotext"
fi

if [ -d "/usr/lib/audiotext" ]; then
	echo "# Launching script Audio Text Desktop"
	/usr/bin/audiotext
fi

if [ -d "/snap/audiotext/x1" ]; then
	echo "# Launching snap Audio Text Desktop"
	/usr/bin/snap run audiotext
fi
