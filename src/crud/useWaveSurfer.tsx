import _ from 'lodash';
import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { createWaveSurfer } from '../components/WSAudioPlugins';
//import { useMounted } from '../utils';
//import { convertToMP3 } from '../utils/mp3';
import { convertToWav } from '../utils/wav';
import { useWaveSurferRegions } from './useWavesurferRegions';
import { SimpleFilter, SoundTouch } from '../utils/soundtouch';

const noop = () => {};
const noop1 = (x: any) => {};

export function useWaveSurfer(
  container: any,
  onReady: () => void = noop,
  onProgress: (progress: number) => void = noop1,
  onRegion: (count: number, newRegion: boolean) => void = noop1,
  onPlayStatus: (playing: boolean) => void = noop,
  onInteraction: () => void = noop,
  onError: (e: any) => void = noop,
  height: number = 128,
  singleRegionOnly: boolean = false,
  timelineContainer?: any
) {
  //const isMounted = useMounted('wavesurfer');
  const progressRef = useRef(0);
  const wavesurferRef = useRef<WaveSurfer>();
  const blobToLoad = useRef<Blob>();
  const blobTypeRef = useRef('');
  const playingRef = useRef(false);
  const durationRef = useRef(0);
  const userInteractionRef = useRef(true);
  const soundtouchRef = useRef<SoundTouch>();
  const soundtouchSourceRef = useRef<any>();
  const soundtouchNodeRef = useRef<ScriptProcessorNode>();
  const seekingPositionRef = useRef<number>();

  const inputRegionsRef = useRef<{ start: number; end: number }[]>();

  const isNear = (position: number) => {
    return Math.abs(position - progressRef.current) < 0.3;
  };
  const wsDuration = () =>
    durationRef.current || wavesurfer()?.getDuration() || 0;

  const wsGoto = (position: number) => {
    onRegionGoTo(position);
    if (position && wsDuration()) position = position / wsDuration();
    userInteractionRef.current = false;
    wavesurfer()?.seekAndCenter(position);
    userInteractionRef.current = true;
  };
  const progress = () => progressRef.current;
  const setPlaying = (value: boolean) => {
    if (value !== playingRef.current) {
      playingRef.current = value;
      if (value) {
        if (wavesurfer()?.isReady) {
          //play region once if single region
          if (!justPlayRegion(progress())) {
            //default play (which will loop region if looping is on)
            wavesurfer()?.play(progress());
          }
        }
      } else {
        if (wavesurfer()?.isPlaying()) wavesurfer()?.pause();
        soundtouchNodeRef.current && soundtouchNodeRef.current.disconnect();
      }
      if (onPlayStatus) onPlayStatus(playingRef.current);
    }
  };

  const {
    wsAutoSegment,
    wsSplitRegion,
    wsRemoveSplitRegion,
    wsAddOrRemoveRegion,
    wsNextRegion,
    loadRegions,
    wsGetRegions,
    wsLoopRegion,
    justPlayRegion,
    onRegionSeek,
    onRegionProgress,
    onRegionGoTo,
    currentRegion,
    setWaveSurfer,
  } = useWaveSurferRegions(
    singleRegionOnly,
    onRegion,
    onPlayStatus,
    wsDuration,
    isNear,
    wsGoto,
    progress,
    setPlaying
  );

  const wavesurfer = () => wavesurferRef.current;

  const setSoundTouchSource = () => {
    if (wavesurferRef.current) {
      var backend = wavesurferRef.current.backend as any;
      var buffer = backend.buffer;
      soundtouchRef.current = new SoundTouch(buffer.sampleRate);
      let channels = buffer.numberOfChannels;
      let l = buffer.getChannelData(0);
      let r = channels > 1 ? buffer.getChannelData(1) : l;
      let length = buffer.length;

      soundtouchSourceRef.current = {
        extract: function (target: any, numFrames: number, position: number) {
          let seekingDiff = 0;
          if (seekingPositionRef.current) {
            seekingDiff = seekingPositionRef.current - position;
            seekingPositionRef.current = undefined;
          }

          position += seekingDiff;

          for (let i = 0; i < numFrames; i++) {
            target[i * 2] = l[i + position];
            target[i * 2 + 1] = r[i + position];
          }

          return Math.min(numFrames, length - position);
        },
      };
    }
  };
  const setSoundTouchFilter = () => {
    if (soundtouchRef.current && wavesurferRef.current) {
      soundtouchRef.current.tempo = wavesurferRef.current.getPlaybackRate();
      var backend = wavesurferRef.current.backend as any;

      if (soundtouchRef.current.tempo === 1) {
        backend.disconnectFilters();
      } else {
        if (!soundtouchNodeRef.current) {
          let filter = new SimpleFilter(
            soundtouchSourceRef.current,
            soundtouchRef.current
          );
          soundtouchNodeRef.current = soundtouchRef.current.getWebAudioNode(
            backend.ac,
            filter
          );
        }
        backend.setFilter(soundtouchNodeRef.current);
      }
    }
  };
  const setSeekingPos = () => {
    var backend = wavesurferRef.current?.backend as any;
    seekingPositionRef.current = Math.trunc(
      backend.getPlayedPercents() * backend.buffer.length
    );
  };
  useEffect(() => {
    function create(container: any, height: number, singleRegion: boolean) {
      var ws = createWaveSurfer(container, height, timelineContainer);
      wavesurferRef.current = ws;
      setWaveSurfer(ws);
      ws.on('ready', function () {
        durationRef.current = ws.getDuration();
        if (!singleRegionOnly) {
          loadRegions(inputRegionsRef.current, false);
          inputRegionsRef.current = undefined;
        }
        setSoundTouchSource();
        if (playingRef.current) setPlaying(true);
        onReady();
      });
      ws.on(
        'audioprocess',
        _.throttle(function (e: number) {
          if (wavesurfer()?.isPlaying()) setProgress(e);
        }, 150)
      );
      ws.on('play', function () {
        setSeekingPos();
        setSoundTouchFilter();
      });
      ws.on('seek', function (e: number) {
        setSeekingPos();
        onRegionSeek(e, !userInteractionRef.current);
        setProgress(e * wsDuration());
      });
      ws.on('finish', function () {
        setPlaying(false);
      });
      ws.on('interaction', function () {
        if (onInteraction) onInteraction();
      });
      /*
      ws.drawer.on('click', (event: any, progress: number) => {
        console.log('Clicking now', progress);
      });
      */

      return ws;
    }

    if (container && !wavesurfer()) {
      create(container, height, singleRegionOnly);
      if (blobToLoad.current) {
        wsLoad(blobToLoad.current);
        blobToLoad.current = undefined;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container]);

  useEffect(() => {
    // Removes events, elements and disconnects Web Audio nodes on component unmount
    return () => {
      if (wavesurferRef.current) {
        if (wavesurferRef.current.isPlaying()) wavesurferRef.current.stop();
        wavesurferRef.current.unAll();
        wavesurferRef.current.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setProgress = (value: number) => {
    progressRef.current = value;
    onRegionProgress(value);
    onProgress(value);
  };

  const wsClear = () => wavesurfer()?.empty();

  const wsIsReady = () => wavesurfer()?.isReady || false;

  const wsIsPlaying = () => playingRef.current;

  const wsTogglePlay = () => {
    setPlaying(!playingRef.current);
    return playingRef.current;
  };

  const wsPlay = () => setPlaying(true);

  const wsPause = () => setPlaying(false);

  const wsPosition = () => progressRef.current;

  const wsSetPlaybackRate = (rate: number) => {
    if (rate !== wavesurfer()?.getPlaybackRate()) {
      wavesurfer()?.setPlaybackRate(rate);
      if (playingRef.current) setSoundTouchFilter();
    }
  };
  const wsZoom = (zoom: number) => {
    wavesurfer()?.zoom(zoom);
    return wavesurfer()?.params.minPxPerSec;
  };

  const wsLoad = (
    blob: Blob,
    mimeType: string = blob.type,
    regions: string = ''
  ) => {
    durationRef.current = 0;
    if (regions) inputRegionsRef.current = JSON.parse(regions);
    if (!wavesurfer()) blobToLoad.current = blob;
    else wavesurfer()?.loadBlob(blob);
    blobTypeRef.current = mimeType;
  };

  const wsBlob = async () => {
    var backend = wavesurfer()?.backend as any;
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
  const wsSkip = (amt: number) => wavesurfer()?.skip(amt);

  const wsSetHeight = (height: number) => wavesurfer()?.setHeight(height);

  const trimTo = (val: number, places: number) => {
    var dec = places > 0 ? 10 ** places : 1;
    return ((val * dec) >> 0) / dec;
  };
  function loadDecoded(new_buffer: any) {
    wavesurfer()?.loadDecodedBuffer(new_buffer);
  }

  const insertBuffer = (
    newBuffer: any,
    startposition: number,
    endposition: number
  ) => {
    if (!wavesurfer()) return 0;
    var backend = wavesurfer()?.backend as any;
    var originalBuffer = backend.buffer;
    if (startposition === 0 && (originalBuffer?.length | 0) === 0) {
      loadDecoded(newBuffer);
      return newBuffer.length / newBuffer.sampleRate;
    }
    var start_offset = (startposition * originalBuffer.sampleRate) >> 0;
    var after_offset = (endposition * originalBuffer.sampleRate) >> 0;
    var after_len = originalBuffer.length - after_offset;
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
      var new_data = newBuffer.getChannelData(
        ix < newBuffer.numChannels ? ix : newBuffer.numberOfChannels - 1
      );
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
    durationRef.current = wavesurfer()?.getDuration() || 0;
    return (start_offset + newBuffer.length) / originalBuffer.sampleRate;
  };

  const wsInsertAudio = async (
    blob: Blob,
    position: number,
    overwriteToPosition: number,
    mimeType?: string
  ) => {
    if (!wavesurfer()) return;
    var backend = wavesurfer()?.backend as any;
    if (!backend) return; //throw?
    var buffer = await blob.arrayBuffer();

    return await new Promise<number>((resolve, reject) => {
      if (!wavesurfer()?.backend) return; //closed while we were working on the blob
      wavesurfer()?.decodeArrayBuffer(buffer, function (newBuffer: any) {
        resolve(insertBuffer(newBuffer, position, overwriteToPosition));
      });
    });
  };

  const wsInsertSilence = (seconds: number, position: number) => {
    if (!wavesurfer()) return;
    var backend = wavesurfer()?.backend as any;
    var originalBuffer = backend.buffer;
    var new_len = ((seconds / 1.0) * originalBuffer.sampleRate) >> 0;
    var newBuffer = backend.ac.createBuffer(
      originalBuffer.numberOfChannels,
      new_len,
      originalBuffer.sampleRate
    );
    insertBuffer(newBuffer, position, position);
  };

  //delete the audio in the current region
  const wsRegionDelete = () => {
    if (!currentRegion() || !wavesurfer()) return;
    var start = trimTo(currentRegion().start, 3);
    var end = trimTo(currentRegion().end, 3);
    var len = end - start;
    var backend = wavesurfer()?.backend as any;
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
    wavesurfer()?.regions.clear();
    onRegion(0, true);
    var tmp = start - 0.03;
    if (tmp < 0) tmp = 0;
    wsGoto(tmp);
    durationRef.current = wavesurfer()?.getDuration() || 0;
    return emptySegment;
  };

  return {
    wsLoad,
    wsBlob,
    wsClear,
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
    wsLoopRegion,
    wsRegionDelete,
    wsInsertAudio,
    wsInsertSilence,
    wsZoom,
    wsGetRegions,
    wsAutoSegment,
    wsNextRegion,
    wsSplitRegion,
    wsAddOrRemoveRegion,
    wsRemoveSplitRegion,
  };
}
