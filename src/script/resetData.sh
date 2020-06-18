#!/bin/bash

if [ -d "${HOME}/.config/sil-transcriber" ]; then
	echo "# Removing .deb user data"
	rm -rf "${HOME}/.config/sil-transcriber"
fi

if [ -d "${HOME}/snap/sil-transcriber/x1/.config/sil-transcriber" ]; then
	echo "# Removing snap user data"
	rm -rf "${HOME}/snap/sil-transcriber/x1/.config/sil-transcriber"
fi

if [ -d "/opt/SIL Transcriber Desktop Extension" ]; then
	echo "# Launching builder SIL Transcriber Desktop Extension"
	"/opt/SIL Transcriber Desktop Extension/sil-transcriber"
fi

if [ -d "/usr/lib/sil-transcriber" ]; then
	echo "# Launching script SIL Transcriber Desktop Extension"
	/usr/bin/sil-transcriber
fi

if [ -d "/snap/sil-transcriber/x1" ]; then
	echo "# Launching snap SIL Transcriber Desktop Extension"
	/usr/bin/snap run sil-transcriber
fi
