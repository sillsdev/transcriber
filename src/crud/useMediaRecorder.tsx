import React, { useRef } from 'react';
import { useGlobal } from 'reactn';
import { useState, useEffect } from 'react';
import { useUserMedia } from './useUserMedia';
import { useSnackBar } from '../hoc/SnackBar';
import { logError, Severity } from '../utils';

const CAPTURE_OPTIONS = {
  audio: true,
  video: false,
};
const noop = () => {};
export interface MimeInfo {
  mimeType: string;
  extension: string;
}
export function useMediaRecorder(
  allowRecord: boolean = true,
  onStart: () => void = noop,
  onStop: (blob: Blob) => void = noop,
  onError: (e: any) => void = noop,
  onDataAvailable: (e: any, blob: Blob) => void = noop
) {
  const mediaChunks = useRef<any>([]);
  const [playerUrl, setPlayerUrl] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>();
  const getMediaStream = useUserMedia(CAPTURE_OPTIONS);
  const streamRequested = React.useRef<boolean>(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | undefined>(
    undefined
  );
  const [mediaBlob, setMediaBlob] = React.useState<Blob>();
  const [acceptedMimes, setAcceptedMimes] = useState<MimeInfo[]>([]);
  const [reporter] = useGlobal('errorReporter');
  const { showMessage } = useSnackBar();

  useEffect(() => {
    const acceptextension = ['mp3', 'webm', 'mka', 'm4a', 'wav', 'ogg'];
    const defaultacceptmime = [
      'audio/mpeg',
      'audio/webm;codecs=opus',
      'audio/webm;codecs=pcm',
      'audio/x-m4a',
      'audio/wav',
      'audio/ogg;codecs=opus',
    ];
    var mimes: MimeInfo[] = [];
    for (var i in defaultacceptmime) {
      if (MediaRecorder.isTypeSupported(defaultacceptmime[i])) {
        mimes.push({
          mimeType: defaultacceptmime[i],
          extension: acceptextension[i],
        });
      }
    }
    setAcceptedMimes(mimes);
    return () => {
      console.log('cleanup recorder');
      mediaStream?.getTracks().forEach((track) => {
        console.log('stop track');
        track.stop();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (allowRecord)
      if (!mediaStream && !streamRequested.current) {
        streamRequested.current = true;
        getMediaStream().then((stream) => {
          if (stream && stream.id && stream.active) {
            setMediaStream(stream);
          } else {
            const err = stream.toString();
            logError(Severity.info, reporter, err);
            showMessage(err);
          }
        });
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowRecord, getMediaStream, mediaStream]);

  useEffect(() => {
    startRecorder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaStream]);

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
    startRecording: allowRecord ? startRecording : noop,
    stopRecording: allowRecord ? stopRecording : noop,
    pauseRecording: allowRecord ? pauseRecording : noop,
    resumeRecording: allowRecord ? resumeRecording : noop,
    playerUrl,
    mediaBlob,
    acceptedMimes,
  };
}
