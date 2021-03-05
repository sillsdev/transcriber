import { useState, useEffect } from 'react';

export function useUserMedia(
  requestedMedia: MediaStreamConstraints | undefined
) {
  const [mediaStream, setMediaStream] = useState<MediaStream | undefined>(
    undefined
  );

  useEffect(() => {
    async function enableStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          requestedMedia
        );
        setMediaStream(stream);
      } catch (err) {
        return err;
      }
    }

    if (!mediaStream) {
      enableStream();
    } else {
      return function cleanup() {
        mediaStream.getTracks().forEach((track) => {
          track.stop();
        });
      };
    }
  }, [mediaStream, requestedMedia]);

  return mediaStream;
}
