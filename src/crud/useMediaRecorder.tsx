import { useRef } from 'react';
import { useGlobal } from 'reactn';
import { useState, useEffect } from 'react';
import { useUserMedia } from './useUserMedia';
import { useSnackBar } from '../hoc/SnackBar';
import { logError, Severity, waitForIt } from '../utils';

const CAPTURE_OPTIONS = {
  audio: true,
  video: false,
};
const noop = async () => {};
export interface MimeInfo {
  mimeType: string;
  extension: string;
}
export function useMediaRecorder(
  allowRecord: boolean = true,
  onStart: () => void = noop,
  onStop: (blob: Blob) => void = noop,
  onError: (e: any) => void = noop,
  onDataAvailable: (e: any, blob: Blob) => Promise<void> = noop
) {
  const mediaChunks = useRef<any>([]);
  const [playerUrl, setPlayerUrl] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder>();
  const getMediaStream = useUserMedia(CAPTURE_OPTIONS);
  const streamRequested = useRef<boolean>(false);
  const mediaStreamRef = useRef<MediaStream | undefined>(undefined);
  const [mediaBlob, setMediaBlob] = useState<Blob>();
  const [acceptedMimes, setAcceptedMimes] = useState<MimeInfo[]>([]);
  const [reporter] = useGlobal('errorReporter');
  const { showMessage } = useSnackBar();
  const lastSendDoneRef = useRef(true);

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
      mediaStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (allowRecord)
      if (!mediaStreamRef.current && !streamRequested.current) {
        streamRequested.current = true;
        getMediaStream().then((stream) => {
          if (stream && stream.id && stream.active) {
            mediaStreamRef.current = stream;
          } else {
            const err = stream.toString();
            logError(Severity.info, reporter, err);
            showMessage(err);
          }
        });
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowRecord, getMediaStream]);

  function createBlob() {
    const blob = new Blob(mediaChunks.current);
    setPlayerUrl(window.URL.createObjectURL(blob));
    setMediaBlob(blob);
    return blob;
  }

  function handleDataAvailable(e: any) {
    if (e.data.size) {
      mediaChunks.current.push(e.data);
      if (lastSendDoneRef.current) {
        lastSendDoneRef.current = false;
        onDataAvailable(e.data, createBlob()).then(() => {
          lastSendDoneRef.current = true;
        });
      }
    }
  }

  function handleStopped() {
    const blob = createBlob();
    mediaChunks.current = [];
    waitForIt(
      'last send',
      () => lastSendDoneRef.current,
      () => false,
      200
    ).then(() => onStop(blob));
  }
  function handleError(e: any) {
    console.log(e.error);
    onError(e.error);
  }

  function startRecorder() {
    if (mediaStreamRef.current) {
      const recorder = new MediaRecorder(mediaStreamRef.current);
      if (recorder) {
        recorder.addEventListener('dataavailable', handleDataAvailable);
        recorder.addEventListener('error', handleError);
        recorder.addEventListener('stop', handleStopped);
        mediaRecorderRef.current = recorder;
        return recorder;
      }
    }
  }

  function startRecording(timeSlice?: number) {
    var recorder = mediaRecorderRef.current || startRecorder();
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
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
  }

  function resumeRecording() {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
  }

  function stopRecording() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.removeEventListener(
        'dataavailable',
        handleDataAvailable
      );
      mediaRecorderRef.current.removeEventListener('error', handleError);
      mediaRecorderRef.current.removeEventListener('stop', handleStopped);
      mediaRecorderRef.current = undefined;
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
