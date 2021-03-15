import { useState, useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { createWaveSurfer } from '../components/WSAudioPlugins';

const noop = () => {};
const noop1 = (x: any) => {};

export function useWaveSurfer(
  container: any,
  onReady: () => void = noop,
  onProgress: (progress: number) => void = noop1,
  onRegion: (hasRegion: boolean) => void = noop1,
  onStop: () => void = noop,
  onError: (e: any) => void = noop,
  height: number = 128,
  timelineContainer?: any
) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const wsRef = useRef<WaveSurfer>();
  const playingRef = useRef(false);
  const regionRef = useRef<any>();
  const regionInProgressRef = useRef(false);
  const durationRef = useRef(0);

  useEffect(() => {
    function create(container: any, height: number) {
      var ws = createWaveSurfer(container, height, timelineContainer);
      wsRef.current = ws;
      ws.on('loading ', function (progress) {
        console.log('loading', progress);
      });
      ws.on('ready', function () {
        onReady();
        if (playingRef.current) ws.play();
        console.log('ready', ws.getDuration());
        durationRef.current = ws.getDuration();
      });
      ws.on('audioprocess', function (e: number) {
        setProgress(e);
        onProgress(e);
      });
      ws.on('seek', function (e: number) {
        setProgress(e * durationRef.current);
        onProgress(e * durationRef.current);
        console.log('seek', e, durationRef.current, e * durationRef.current);
      });
      ws.on('finish', function () {
        setPlaying(false);
        onStop();
      });
      ws.on('region-created', function (r: any) {
        console.log('region-created', r, regionRef.current);
        if (regionRef.current) regionRef.current?.remove();
        regionRef.current = r;
        regionInProgressRef.current = true;
        if (onRegion) onRegion(true);
      });
      ws.on('region-update-end', function (r: any) {
        console.log('region-update-end', r);
        regionInProgressRef.current = false;
        wsGoto(regionRef.current.start);
      });
      ws.on('region-play', function (r: any) {
        console.log('region-play', r);
      });
      ws.on('region-out', function (r: any) {
        console.log('region-out', r);
      });
      return ws;
    }

    if (container && !wsRef.current) create(container, height);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container]);

  useEffect(() => {
    // Removes events, elements and disconnects Web Audio nodes.
    // when component unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.unAll();
        wsRef.current.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log(
      'new playing',
      playing,
      'ready?',
      wsRef.current?.isReady,
      'playing?',
      wsRef.current?.isPlaying(),
      'hasregion?',
      regionRef.current !== undefined,
      'looping?',
      regionRef.current?.loop
    );
    playingRef.current = playing;
    if (playingRef.current) {
      if (wsRef.current?.isReady) {
        if (regionRef.current && regionRef.current.loop)
          regionRef.current.playLoop();
        else wsRef.current?.play();
      }
    } else if (wsRef.current?.isPlaying()) wsRef.current?.pause();
    console.log('playing?', wsRef.current?.isPlaying());
  }, [playing, wsRef.current?.isReady]);

  const wsIsReady = () => wsRef.current?.isReady || false;

  const wsIsPlaying = () => playing;

  const wsTogglePlay = () => {
    setPlaying(!playing);
    return !playing;
  };

  const wsPlay = () => setPlaying(true);

  const wsPause = () => setPlaying(false);

  const wsDuration = () =>
    durationRef.current || wsRef.current?.getDuration() || 0;

  const wsPosition = () => progress;

  const wsGoto = (position: number) => {
    console.log('goto', position, durationRef.current);
    if (position && durationRef.current)
      position = position / durationRef.current;
    console.log('seekto', position);
    wsRef.current?.seekAndCenter(position);
  };
  const wsSetPlaybackRate = (rate: number) =>
    wsRef.current?.setPlaybackRate(rate);

  const wsLoad = (blob: Blob) => wsRef.current?.loadBlob(blob);

  const wsSkip = (amt: number) => wsRef.current?.skip(amt);

  const wsSetHeight = (height: number) => wsRef.current?.setHeight(height);

  const wsHasRegion = () => regionRef.current !== undefined;

  const wsLoopRegion = (loop: boolean) => {
    if (!regionRef.current) return false;
    regionRef.current.loop = loop;
    console.log('loop', regionRef.current.loop);
    if (regionRef.current.loop) wsGoto(regionRef.current.start);
    return regionRef.current.loop;
  };

  const wsRegionIsLooping = (): boolean => {
    if (!regionRef.current) return false;
    console.log('islooping?', regionRef.current.loop);
    return regionRef.current.loop;
  };
  const trimTo = (val: number, places: number) => {
    var dec = places > 0 ? 10 ** places : 1;
    return ((val * dec) >> 0) / dec;
  };
  function loadDecoded(new_buffer: any) {
    wsRef.current?.loadDecodedBuffer(new_buffer);
  }
  const insertBuffer = (
    newBuffer: any,
    position: number,
    overwrite: boolean
  ) => {
    if (!wsRef.current) return;
    var wavesurfer = wsRef.current;
    var backend = wavesurfer?.backend as any;
    var originalBuffer = backend.buffer;

    if (
      position === 0 &&
      overwrite &&
      newBuffer.length > originalBuffer.length
    ) {
      loadDecoded(newBuffer);
      return;
    }
    var offset = ((position / 1) * originalBuffer.sampleRate) >> 0;
    var after_len = originalBuffer.length - offset;
    var after_start = offset;
    if (overwrite) {
      after_len -= newBuffer.length;
      if (after_len < 0) after_len = 0;
      after_start = offset + newBuffer.length;
    }
    var new_len = offset + newBuffer.length + after_len;
    var uberSegment = null;
    uberSegment = backend.ac.createBuffer(
      originalBuffer.numberOfChannels,
      new_len,
      originalBuffer.sampleRate
    );

    for (var ix = 0; ix < originalBuffer.numberOfChannels; ++ix) {
      var chan_data = originalBuffer.getChannelData(ix);
      var new_data = newBuffer.getChannelData(ix);
      var uber_chan_data = uberSegment.getChannelData(ix);

      uber_chan_data.set(chan_data.slice(0, offset));
      uber_chan_data.set(new_data, offset);
      if (after_len)
        uber_chan_data.set(
          chan_data.slice(after_start),
          offset + newBuffer.length
        );
    }
    loadDecoded(uberSegment);
  };
  const wsInsertAudio = async (
    blob: Blob,
    position: number,
    overwrite: boolean
  ) => {
    if (!wsRef.current) return;
    var wavesurfer = wsRef.current;
    var backend = wavesurfer?.backend as any;
    var originalBuffer = backend.buffer;
    if (!originalBuffer) {
      wavesurfer.loadBlob(blob);
      return;
    }
    var buffer = await blob.arrayBuffer();
    wavesurfer.decodeArrayBuffer(buffer, function (newBuffer: any) {
      insertBuffer(newBuffer, position, overwrite);
    });
  };
  const wsInsertSilence = (seconds: number, position: number) => {
    if (!wsRef.current) return;
    var wavesurfer = wsRef.current;
    var backend = wavesurfer.backend as any;
    var originalBuffer = backend.buffer;
    var new_len = ((seconds / 1.0) * originalBuffer.sampleRate) >> 0;
    var newBuffer = backend.ac.createBuffer(
      originalBuffer.numberOfChannels,
      new_len,
      originalBuffer.sampleRate
    );
    insertBuffer(newBuffer, position, false);
  };

  const wsRegionDelete = () => {
    if (!regionRef.current || !wsRef.current) return;
    var wavesurfer = wsRef.current;
    var start = trimTo(regionRef.current.start, 3);
    var end = trimTo(regionRef.current.end, 3);
    var len = end - start;
    var backend = wavesurfer.backend as any;
    var originalBuffer = backend.buffer;
    var new_len = ((len / 1) * originalBuffer.sampleRate) >> 0;
    var new_offset = ((start / 1) * originalBuffer.sampleRate) >> 0;
    var emptySegment = backend.ac.createBuffer(
      originalBuffer.numberOfChannels,
      new_len,
      originalBuffer.sampleRate
    );
    var uberSegment = null;
    uberSegment = backend.ac.createBuffer(
      originalBuffer.numberOfChannels,
      originalBuffer.length - new_len,
      originalBuffer.sampleRate
    );

    for (var ix = 0; ix < originalBuffer.numberOfChannels; ++ix) {
      var chan_data = originalBuffer.getChannelData(ix);
      var segment_chan_data = emptySegment.getChannelData(ix);
      var uber_chan_data = uberSegment.getChannelData(ix);
      //save what's there
      segment_chan_data.set(chan_data.slice(new_offset, new_offset + new_len));

      uber_chan_data.set(chan_data.slice(0, new_offset));

      uber_chan_data.set(chan_data.slice(new_offset + new_len), new_offset);
    }

    loadDecoded(uberSegment);
    wsRef.current?.regions.clear();
    onRegion(false);
    var tmp = start - 0.03;
    if (tmp < 0) tmp = 0;
    wsGoto(tmp);
    return emptySegment;
  };

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
    wsHasRegion,
    wsLoopRegion,
    wsRegionIsLooping,
    wsRegionDelete,
    wsInsertAudio,
    wsInsertSilence,
  };
}
