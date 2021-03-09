import { useState, useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { createWaveSurfer } from '../components/WSAudioPlugins';

const noop = () => {};

export function useWaveSurfer(
  container: any,
  onReady: () => void = noop,
  onProgress: (progress: number) => void,
  onStop: () => void = noop,
  onError: (e: any) => void = noop,
  height: number = 128,
  timelineContainer?: any
) {
  const [wavesurfer, setWaveSurfer] = useState<WaveSurfer>();
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [oneRegion, setOneRegion] = useState<any>();
  const playingRef = useRef(false);

  useEffect(() => {
    function create(container: any, height: number) {
      var ws = createWaveSurfer(container, height, timelineContainer);
      setWaveSurfer(ws);
      ws.on('ready', function () {
        onReady();
        if (playingRef.current) ws.play();
        setDuration(ws.getDuration());
      });
      ws.on('audioprocess', function (e: number) {
        setProgress(e);
        console.log('audioprocess', e);
      });
      ws.on('seek', function (e: number) {
        setProgress(e * duration);
        console.log('seek', e, e * duration);
      });
      ws.on('finish', function () {
        setPlaying(false);
      });
      ws.on('region-created', function (r: any) {
        console.log('region-created', r);
        console.log('existing', oneRegion);
        if (oneRegion) oneRegion.remove();
        setOneRegion(r);
      });

      return ws;
    }

    if (container && !wavesurfer) create(container, height);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container]);

  useEffect(() => {
    // Removes events, elements and disconnects Web Audio nodes.
    // when component unmount
    return () => {
      if (wavesurfer) {
        wavesurfer?.unAll();
        wavesurfer.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log(
      'new playing',
      playing,
      playingRef.current,
      wavesurfer?.isReady,
      wavesurfer?.isPlaying()
    );
    playingRef.current = playing;
    if (playingRef.current) {
      if (wavesurfer?.isReady) wavesurfer?.play();
    } else if (wavesurfer?.isPlaying()) wavesurfer?.pause();
    console.log('playing?', wavesurfer?.isPlaying());
  }, [playing, wavesurfer]);

  function wsIsReady() {
    console.log(wavesurfer?.isReady);
    return wavesurfer?.isReady || false;
  }
  function wsIsPlaying() {
    return playing;
  }
  function wsTogglePlay() {
    console.log('toggle to', !playing);
    setPlaying(!playing);
  }
  function wsPlay() {
    setPlaying(true);
  }
  function wsPause() {
    setPlaying(false);
  }
  function wsDuration() {
    return duration || wavesurfer?.getDuration() || 0;
  }
  function wsPosition() {
    return progress;
  }
  function wsGoto(position: number) {
    if (position && wsDuration()) position = position / wsDuration();
    wavesurfer?.seekAndCenter(position);
  }
  function wsSetPlaybackRate(rate: number) {
    wavesurfer?.setPlaybackRate(rate);
  }
  function wsLoad(blob: Blob) {
    wavesurfer?.loadBlob(blob);
  }
  function wsSkip(amt: number) {
    wavesurfer?.skip(amt);
  }
  function wsSetHeight(height: number) {
    wavesurfer?.setHeight(height);
  }
  return {
    wsLoad,
    wsIsReady,
    wsIsPlaying,
    wsTogglePlay,
    wsPlay,
    wsPause,
    wsGoto,
    wsSetPlaybackRate,
    wsDuration,
    wsPosition,
    wsSkip,
    wsSetHeight,
  };
}
