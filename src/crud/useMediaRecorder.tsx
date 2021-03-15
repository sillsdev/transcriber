import React, { useRef } from 'react';
import { useState, useEffect } from 'react';
import { useUserMedia } from './useUserMedia';

const CAPTURE_OPTIONS = {
  audio: true,
  video: false,
};
const noop = () => {};

export function useMediaRecorder(
  onStart: () => void = noop,
  onStop: (blob: Blob) => void = noop,
  onError: (e: any) => void = noop,
  onDataAvailable: (e: any, blob: Blob) => void = noop
) {
  const mediaChunks = useRef<any>([]);
  const [playerUrl, setPlayerUrl] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>();
  const mediaStream = useUserMedia(CAPTURE_OPTIONS);
  const [mediaBlob, setMediaBlob] = React.useState<Blob>();

  useEffect(() => {
    startRecorder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function createBlob() {
    const blob = new Blob(mediaChunks.current);
    setPlayerUrl(window.URL.createObjectURL(blob));
    setMediaBlob(blob);
    return blob;
  }
  function handleDataAvailable(e: any) {
    if (e.data.size) {
      mediaChunks.current.push(e.data);
      onDataAvailable(e.data, createBlob());
    }
  }

  function handleStopped() {
    let [sampleChunk] = mediaChunks.current;
    if (sampleChunk && sampleChunk.type) console.log(sampleChunk.type);
    const blob = createBlob();
    mediaChunks.current = [];
    onStop(blob);
  }
  function handleError(e: any) {
    console.log(e.error);
    onError(e.error);
  }

  function startRecorder() {
    if (mediaStream) {
      const recorder = new MediaRecorder(mediaStream);
      if (recorder) {
        recorder.addEventListener('dataavailable', handleDataAvailable);
        recorder.addEventListener('error', handleError);
        recorder.addEventListener('stop', handleStopped);
        setMediaRecorder(recorder);
        return recorder;
      }
    }
  }

  function startRecording(timeSlice?: number) {
    var recorder = mediaRecorder || startRecorder();
    setPlayerUrl('');
    mediaChunks.current = [];
    if (recorder) {
      recorder.start(timeSlice);
      onStart();
    } else {
      onError({ error: 'No mediaRecorder' });
    }
  }

  function pauseRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
    }
  }

  function resumeRecording() {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
    }
  }

  function stopRecording() {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.removeEventListener('dataavailable', handleDataAvailable);
      mediaRecorder.removeEventListener('error', handleError);
      mediaRecorder.removeEventListener('stop', handleStopped);
      setMediaRecorder(undefined);
    }
  }
  return {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    playerUrl,
    mediaBlob,
  };
}
