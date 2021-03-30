import _ from 'lodash';
import { useState, useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { createWaveSurfer } from '../components/WSAudioPlugins';
//import { convertToMP3 } from '../utils/mp3';
import { convertToWav } from '../utils/wav';

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
  const blobTypeRef = useRef('');
  const playingRef = useRef(false);
  const regionRef = useRef<any>();
  const keepRegion = useRef(false);
  const durationRef = useRef(0);

  useEffect(() => {
    function create(container: any, height: number) {
      var ws = createWaveSurfer(container, height, timelineContainer);
      wsRef.current = ws;

      ws.on('ready', function () {
        onReady();
        durationRef.current = ws.getDuration();
      });
      ws.on(
        'audioprocess',
        _.throttle(function (e: number) {
          setProgress(e);
          onProgress(e);
        }, 150)
      );
      ws.on('seek', function (e: number) {
        setProgress(e * durationRef.current);
        onProgress(e * durationRef.current);
        if (!keepRegion.current && regionRef.current) {
          regionRef.current?.remove();
          regionRef.current = undefined;
          if (onRegion) onRegion(false);
        }
      });
      ws.on('finish', function () {
        setPlaying(false);
        onStop();
      });
      ws.on('region-created', function (r: any) {
        if (regionRef.current) regionRef.current?.remove();
        regionRef.current = r;
        keepRegion.current = true;
        if (onRegion) onRegion(true);
      });
      ws.on('region-update-end', function (r: any) {
        wsGoto(regionRef.current.start);
        keepRegion.current = false;
      });
      /* other potentially useful messages
      ws.on('loading', function (progress) {
        console.log('loading', progress);
      });
      ws.on('region-play', function (r: any) {
        console.log('region-play', r);
      });
      ws.on('region-out', function (r: any) {
        console.log('region-out', r.loop, playingRef.current)
      });
      */
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
    playingRef.current = playing;
    if (playingRef.current) {
      if (wsRef.current?.isReady) {
        wsRef.current?.play(progress);
      }
    } else if (wsRef.current?.isPlaying()) {
      wsRef.current?.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (position && durationRef.current)
      position = position / durationRef.current;
    keepRegion.current = true;
    wsRef.current?.seekAndCenter(position);
    keepRegion.current = false;
  };
  const wsSetPlaybackRate = (rate: number) =>
    wsRef.current?.setPlaybackRate(rate);

  const wsLoad = (blob: Blob, mimeType?: string) => {
    wsRef.current?.loadBlob(blob);
    blobTypeRef.current = mimeType || blob.type;
  };

  const wsBlob = async () => {
    var wavesurfer = wsRef.current;
    var backend = wavesurfer?.backend as any;
    if (backend) {
      var originalBuffer = backend.buffer;
      var channels = originalBuffer.numberOfChannels;
      var data_left = originalBuffer.getChannelData(0);
      var data_right = null;
      if (channels === 2) {
        data_right = originalBuffer.getChannelData(1);
        if (!data_left && data_right) {
          data_left = data_right;
          data_right = null;
          channels = 1;
        }
      }
      return convertToWav(data_left, data_right, {
        isFloat: true, // floating point or 16-bit integer (WebAudio API decodes to Float32Array) ???
        numChannels: channels,
        sampleRate: originalBuffer.sampleRate,
      });
    }
    return undefined;
  };
  const wsSkip = (amt: number) => wsRef.current?.skip(amt);

  const wsSetHeight = (height: number) => wsRef.current?.setHeight(height);

  const wsHasRegion = () => regionRef.current !== undefined;

  const wsLoopRegion = (loop: boolean) => {
    if (!regionRef.current) return false;
    regionRef.current.loop = loop;
    if (regionRef.current.loop) wsGoto(regionRef.current.start);
    return regionRef.current.loop;
  };

  const wsRegionIsLooping = (): boolean => {
    if (!regionRef.current) return false;
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
    startposition: number,
    endposition?: number
  ) => {
    if (!wsRef.current) return 0;
    var wavesurfer = wsRef.current;
    var backend = wavesurfer?.backend as any;
    var originalBuffer = backend.buffer;

    if (
      startposition === 0 &&
      endposition === undefined &&
      newBuffer.length > (originalBuffer?.length | 0)
    ) {
      loadDecoded(newBuffer);
      return newBuffer.length / originalBuffer.sampleRate;
    }
    var start_offset = ((startposition / 1) * originalBuffer.sampleRate) >> 0;

    var after_len = 0;
    var after_offset = 0;

    if (endposition !== undefined) {
      after_offset = (endposition * originalBuffer.sampleRate) >> 0;
    } else {
      after_offset = start_offset + newBuffer.length;
    }
    after_len = originalBuffer.length - after_offset;
    if (after_len < 0) after_len = 0;
    var new_len = start_offset + newBuffer.length + after_len;
    var uberSegment = null;
    uberSegment = backend.ac.createBuffer(
      originalBuffer.numberOfChannels,
      new_len,
      originalBuffer.sampleRate
    );

    for (var ix = 0; ix < originalBuffer.numberOfChannels; ++ix) {
      var chan_data = originalBuffer.getChannelData(ix);
      var new_data = newBuffer.getChannelData(0); //we're not recording in stereo currently
      var uber_chan_data = uberSegment.getChannelData(ix);

      uber_chan_data.set(chan_data.slice(0, start_offset));
      uber_chan_data.set(new_data, start_offset);
      if (after_len)
        uber_chan_data.set(
          chan_data.slice(after_offset),
          start_offset + newBuffer.length
        );
    }
    loadDecoded(uberSegment);
    return (start_offset + newBuffer.length) / originalBuffer.sampleRate;
  };

  const wsInsertAudio = async (
    blob: Blob,
    position: number,
    overwriteToPosition?: number,
    mimeType?: string
  ) => {
    if (!wsRef.current) return;
    var wavesurfer = wsRef.current;
    var backend = wavesurfer?.backend as any;
    if (!backend) return; //throw?
    var originalBuffer = backend.buffer;
    if (!originalBuffer) {
      wsLoad(blob, mimeType);
      return;
    }
    var buffer = await blob.arrayBuffer();

    return await new Promise<number>((resolve, reject) => {
      wavesurfer.decodeArrayBuffer(buffer, function (newBuffer: any) {
        resolve(insertBuffer(newBuffer, position, overwriteToPosition));
      });
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
    insertBuffer(newBuffer, position, position);
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
    wsBlob,
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
