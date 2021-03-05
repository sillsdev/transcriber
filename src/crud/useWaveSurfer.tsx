import { useState, useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
//import * as WaveSurferRegions from "wavesurfer.js/dist/plugin/wavesurfer.regions.js";

const noop = () => {};

export function useWaveSurfer(
  container: any,
  onReady: () => void = noop,
  onStop: () => void = noop,
  onError: (e: any) => void = noop,
  height: number = 128
) {
  const [wavesurfer, setWaveSurfer] = useState<WaveSurfer>();
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);

  useEffect(() => {
    function create(container: any, height: number) {
      var ws = WaveSurfer.create({
        container: container,
        scrollParent: true,
        waveColor: '#A8DBA8',
        progressColor: '#3B8686',
        height: height,
        /*
      plugins: [
        WaveSurferRegions.create({
          regionsMinLength: 2,
          regions: [
            {
              start: 1,
              end: 3,
              loop: false,
              color: "hsla(400, 100%, 30%, 0.5)",
            },
            {
              start: 5,
              end: 7,
              loop: false,
              color: "hsla(200, 50%, 70%, 0.4)",
              minLength: 1,
            },
          ],
          dragSelection: {
            slop: 5,
          },
        }),
      ],*/
      });
      setWaveSurfer(ws);
      ws.on('ready', function () {
        onReady();
        console.log('ready - playing:', playingRef.current, ws.isPlaying());
        if (playingRef.current) ws.play();
        console.log('started?', playingRef.current, ws.isPlaying());
      });
      //ws.on("audioprocess", function (e: number) {
      //  setProgress(e);
      //  //console.log(e);
      //});
      ws.on('finish', function () {
        setPlaying(false);
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
    return wavesurfer?.getDuration() || 0;
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
    wsSkip,
    wsSetHeight,
  };
}
