import { useState, useEffect } from 'react';

export function useUserMedia(
  requestedMedia: MediaStreamConstraints
) {
  const [mediaStream, setMediaStream] = useState<MediaStream | undefined>(
    undefined
  );
  async function getStream() {
    if (mediaStream) return mediaStream;
    else
      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          requestedMedia
        );
        console.log('got stream');
        setMediaStream(stream);
        return stream;
      } catch (err) {
        return err;
      }
  }

  useEffect(() => {
    return function cleanup() {
      mediaStream?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return getStream;
}
