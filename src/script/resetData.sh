#!/bin/bash

if [ -d "${HOME}/.config/audio-project-manager" ]; then
	echo "# Removing .deb user data"
	rm -rf "${HOME}/.config/audio-project-manager"
fi

if [ -d "${HOME}/snap/audio-project-manager/x1/.config/audio-project-manager" ]; then
	echo "# Removing snap user data"
	rm -rf "${HOME}/snap/audio-project-manager/x1/.config/audio-project-manager"
fi

if [ -d "/opt/Audio Project Manager Desktop" ]; then
	echo "# Launching builder Audio Project Manager Desktop"
	"/opt/Audio Project Manager Desktop/audio-project-manager"
fi

if [ -d "/usr/lib/audio-project-manager" ]; then
	echo "# Launching script Audio Project Manager Desktop"
	/usr/bin/audio-project-manager
fi

if [ -d "/snap/audio-project-manager/x1" ]; then
	echo "# Launching snap Audio Project Manager Desktop"
	/usr/bin/snap run audio-project-manager
fi
