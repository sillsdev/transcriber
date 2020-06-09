#!/bin/bash

if [ -d "${HOME}/.config/sil-transcriber" ]; then
	echo "# Removing user data"
	rm -rf "${HOME}/.config/sil-transcriber"
fi

if [ -d "/opt/SIL Transcriber Desktop Extension" ]; then
	echo "# Launching SIL Transcriber Desktop"
	"/opt/SIL Transcriber Desktop Extension/sil-transcriber"
fi

