import { useRef, useEffect } from 'react';

export function useUserMedia(requestedMedia: MediaStreamConstraints) {
  const mediaStreamRef = useRef<MediaStream | undefined>(undefined);
  async function getStream() {
    if (mediaStreamRef.current) return mediaStreamRef.current;
    else
      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          requestedMedia
        );
        mediaStreamRef.current = stream;
        return stream;
      } catch (err: any) {
        return err;
      }
  }

  useEffect(() => {
    return function cleanup() {
      console.log(
        'userMedia cleanup',
        mediaStreamRef.current?.getTracks().length
      );
      mediaStreamRef.current?.getTracks().forEach((track) => {
        console.log('usermedia stop');
        track.stop();
      });
      mediaStreamRef.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return getStream;
}
