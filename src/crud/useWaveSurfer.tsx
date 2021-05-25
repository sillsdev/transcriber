import _, { debounce } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useGlobal } from 'reactn';
import WaveSurfer from 'wavesurfer.js';
import { createWaveSurfer } from '../components/WSAudioPlugins';
import { logError, Severity, waitForIt } from '../utils';
//import { useMounted } from '../utils';
//import { convertToMP3 } from '../utils/mp3';
import {
  IRegionParams,
  IRegions,
  useWaveSurferRegions,
} from './useWavesurferRegions';
import { convertToWav, encodeWAV } from '../utils/wav';
import lamejs from 'lamejs';

const noop = () => {};
const noop1 = (x: any) => {};

export function useWaveSurfer(
  container: any,
  onReady: () => void = noop,
  onProgress: (progress: number) => void = noop1,
  onRegion: (
    count: number,
    params: IRegionParams | undefined,
    newRegion: boolean
  ) => void = noop1,
  onCanUndo: (canUndo: boolean) => void = noop1,
  onPlayStatus: (playing: boolean) => void = noop,
  onInteraction: () => void = noop,
  onError: (e: any) => void = noop,
  height: number = 128,
  singleRegionOnly: boolean = false,
  timelineContainer?: any
) {
  //const isMounted = useMounted('wavesurfer');
  const [globalStore] = useGlobal();
  const progressRef = useRef(0);
  const wavesurferRef = useRef<WaveSurfer>();
  const blobToLoad = useRef<Blob>();
  const loadRequests = useRef(0);
  const playingRef = useRef(false);
  const wavesurferPlayingRef = useRef(false); //don't trust ws.isPlaying()
  const durationRef = useRef(0);
  const userInteractionRef = useRef(true);
  const [undoBuffer, setUndoBuffer] = useState();
  const inputRegionsRef = useRef<IRegions>();
  const regionsLoadedRef = useRef(false);
  const widthRef = useRef(0);
  const containerRef = useRef(container);

  const isNear = (position: number) => {
    return Math.abs(position - progressRef.current) < 0.3;
  };
  const wsDuration = () =>
    durationRef.current || wavesurfer()?.getDuration() || 0;

  const wsGoto = (position: number) => {
    var duration = wsDuration();
    if (position > duration) position = duration;
    onRegionGoTo(position);
    if (duration) position = position / duration;
    if (position === 1 && wavesurfer()?.isPlaying()) {
      //if playing, position messages come in after this one that set it back to previously playing position.  Turn this off first in hopes that all messages are done before we set the position...
      wavesurfer()?.pause();
      waitForIt(
        'wavesurfer stop',
        () => !wavesurfer()?.isPlaying(),
        () => {
          console.log('waiting for pause');
          return false;
        },
        100
      ).then(() => {
        userInteractionRef.current = false;
        wavesurfer()?.seekAndCenter(position);
        userInteractionRef.current = true;
      });
    } else {
      userInteractionRef.current = false;
      wavesurfer()?.seekAndCenter(position);
      userInteractionRef.current = true;
    }
  };
  const progress = () => progressRef.current;
  const setPlaying = (value: boolean) => {
    if (value !== playingRef.current) {
      playingRef.current = value;
      try {
        if (value) {
          if (wavesurfer()?.isReady) {
            //play region once if single region
            if (!justPlayRegion(progress())) {
              //default play (which will loop region if looping is on)
              wavesurfer()?.play(progress());
            }
          }
        } else {
          try {
            if (wavesurferPlayingRef.current) wavesurfer()?.pause();
          } catch {
            //ignore
          }
        }
        if (onPlayStatus) onPlayStatus(playingRef.current);
      } catch (error: any) {
        logError(Severity.error, globalStore.errorReporter, error);
      }
    }
  };

  const {
    wsAutoSegment,
    wsSplitRegion,
    wsRemoveSplitRegion,
    wsAddOrRemoveRegion,
    wsPrevRegion,
    wsNextRegion,
    loadRegions,
    clearRegions,
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

  const wavesurfer = () =>
    wavesurferRef.current?.isDestroyed ? undefined : wavesurferRef.current;

  useEffect(() => {
    function create(container: any, height: number) {
      var ws = createWaveSurfer(container, height, timelineContainer);
      wavesurferRef.current = ws;
      setWaveSurfer(ws);
      ws.on('ready', function () {
        //recording also sends ready
        if (loadRequests.current > 0) loadRequests.current--;
        if (!loadRequests.current) {
          durationRef.current = ws.getDuration();
          if (!regionsLoadedRef.current) {
            //we need to call this even if undefined to setup regions variables
            loadRegions(inputRegionsRef.current, false);
            regionsLoadedRef.current = true;
          }
          if (playingRef.current) setPlaying(true);
          onReady();
        } else {
          //requesting load of blob that came in while this one was loading
          wsLoad();
        }
      });
      ws.on('destroy', function () {
        wavesurferRef.current = undefined;
      });
      ws.on(
        'audioprocess',
        _.throttle(function (e: number) {
          if (wavesurferPlayingRef.current) setProgress(e);
        }, 150)
      );
      ws.on('play', function () {
        wavesurferPlayingRef.current = true;
      });
      ws.on('pause', function () {
        wavesurferPlayingRef.current = false;
      });
      ws.on('seek', function (e: number) {
        onRegionSeek(e, !userInteractionRef.current);
        setProgress(e * wsDuration());
      });
      ws.on('finish', function () {
        //we'll get a pause next, so don't set wavesurferPlayingRef here
        setPlaying(false);
      });
      ws.on('interaction', function () {
        if (onInteraction) onInteraction();
      });
      ws.on('redraw', function (peaks: any, width: number) {
        widthRef.current = width;
      });
      // ws.drawer.on('click', (event: any, progress: number) => {
      //   console.log('Clicking now', progress);
      // });
      return ws;
    }
    if (container && !wavesurferRef.current) {
      create(container, height);
      containerRef.current = container;
      if (blobToLoad.current) {
        wsLoad();
      }
      onCanUndo && onCanUndo(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container, wavesurferRef.current]);

  useEffect(() => {
    // Removes events, elements and disconnects Web Audio nodes on component unmount
    return () => {
      blobToLoad.current = undefined;
      if (wavesurferRef.current) {
        var ws = wavesurferRef.current;
        if (wavesurferPlayingRef.current) ws.stop();
        wavesurferPlayingRef.current = false;
        wavesurferRef.current = undefined;
        ws.unAll();
        ws.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setProgress = (value: number) => {
    progressRef.current = value;
    onRegionProgress(value);
    onProgress(value);
  };

  const wsClear = () => {
    if (wavesurferPlayingRef.current) wavesurferRef.current?.stop();
    setUndoBuffer(copyOriginal());
    onCanUndo(true);
    wavesurfer()?.loadDecodedBuffer();
    durationRef.current = 0;
    setProgress(0);
  };

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
    }
  };
  const wsZoom = debounce((zoom: number) => {
    wavesurfer()?.zoom(zoom);
    return wavesurfer()?.params.minPxPerSec;
  }, 10);

  const wsPctWidth = () => {
    return (
      widthRef.current /
      (containerRef.current.clientWidth * wavesurfer()?.params.pixelRatio)
    );
  };

  const wsLoad = (blob?: Blob, regions: string = '') => {
    durationRef.current = 0;
    if (regions) inputRegionsRef.current = JSON.parse(regions);
    regionsLoadedRef.current = false;
    if (!wavesurfer() || !wavesurfer()?.backend) {
      blobToLoad.current = blob;
      loadRequests.current = 1;
    } else if (blob) {
      if (loadRequests.current) {
        //queue this
        blobToLoad.current = blob;
        loadRequests.current = 2; //if there was another, we'll bypass it
      } else {
        wavesurfer()?.loadBlob(blob);
        loadRequests.current = 1;
      }
    } else if (blobToLoad.current) {
      wavesurfer()?.loadBlob(blobToLoad.current);
      blobToLoad.current = undefined;
    }
  };

  const wsLoadRegions = (regions: string) => {
    if (wavesurfer()?.isReady) {
      loadRegions(JSON.parse(regions), false);
      regionsLoadedRef.current = true;
    } else {
      inputRegionsRef.current = JSON.parse(regions);
      regionsLoadedRef.current = false;
    }
  };
  const wsClearRegions = () => {
    if (wavesurfer()?.isReady) {
      clearRegions();
    } else {
      inputRegionsRef.current = undefined;
    }
  };
  function encodeMono(
    channels: number,
    sampleRate: number,
    samples: Int16Array
  ) {
    var mp3Data = [];

    var mp3encoder = new lamejs.Mp3Encoder(1, 44100, 128);
    var mp3Tmp = mp3encoder.encodeBuffer(samples); //encode mp3

    //Push encode buffer to mp3Data variable
    mp3Data.push(mp3Tmp);

    // Get end part of mp3
    mp3Tmp = mp3encoder.flush();

    // Write last data to the output data, too
    // mp3Data contains now the complete mp3Data
    mp3Data.push(mp3Tmp);

    console.debug(mp3Data);
    /*
    var buffer = [];
    var remaining = samples.length;
    var maxSamples = 1152;
    for (var i = 0; remaining >= maxSamples; i += maxSamples) {
      var mono = samples.subarray(i, i + maxSamples);
      var mp3buf = mp3enc.encodeBuffer(mono);
      if (mp3buf.length > 0) {
        buffer.push(new Int8Array(mp3buf));
      }
      remaining -= maxSamples;
    }
    var d = mp3enc.flush();
    if (d.length > 0) {
      buffer.push(new Int8Array(d));
    }
*/
    console.log('done encoding, size=', mp3Data.length);
    var blob = new Blob(mp3Data, { type: 'audio/mp3' });
    return blob;
  }
  const interleave = (left: any, right: any) => {
    if (right) {
      const interleaved = new Int16Array(left.length + right.length);
      for (let src = 0, dst = 0; src < left.length; src++, dst += 2) {
        interleaved[dst] = left[src];
        interleaved[dst + 1] = right[src];
      }
      return interleaved;
    } else {
      return left;
    }
  };
  const wsBlob = async () => {
    var backend = wavesurfer()?.backend as any;
    var originalBuffer = backend?.buffer;
    if (originalBuffer) {
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
      /*
      var wavblob = await convertToWav(data_left, data_right, {
        isFloat: true, // floating point or 16-bit integer (WebAudio API decodes to Float32Array) ???
        numChannels: channels,
        sampleRate: originalBuffer.sampleRate,
      });
      return wavblob */
      let dataview = encodeWAV(1, originalBuffer.sampleRate, data_left);
      let mp3 = new Blob([dataview], { type: 'audio/mp3' });
      //var mp3 = encodeMono(channels, originalBuffer.sampleRate, samples);
      return mp3;
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
  const copyOriginal = () => {
    if (!wavesurfer()) return 0;
    var backend = wavesurfer()?.backend as any;
    var originalBuffer = backend?.buffer;
    if (originalBuffer) {
      var len = originalBuffer.length;
      var uberSegment = null;
      uberSegment = backend.ac.createBuffer(
        originalBuffer.numberOfChannels,
        len,
        originalBuffer.sampleRate
      );
      for (var ix = 0; ix < originalBuffer.numberOfChannels; ++ix) {
        var chan_data = originalBuffer.getChannelData(ix);
        var uber_chan_data = uberSegment.getChannelData(ix);

        uber_chan_data.set(chan_data);
      }
      return uberSegment;
    } else return null;
  };
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
  const wsStartRecord = () => {
    setUndoBuffer(copyOriginal());
  };
  const wsStopRecord = () => {
    onCanUndo(true);
  };
  const wsInsertSilence = (seconds: number, position: number) => {
    if (!wavesurfer()) return;
    var backend = wavesurfer()?.backend as any;
    var originalBuffer = backend.buffer;
    if (originalBuffer !== null) {
      var new_len = ((seconds / 1.0) * originalBuffer.sampleRate) >> 0;
      var newBuffer = backend.ac.createBuffer(
        originalBuffer.numberOfChannels,
        new_len,
        originalBuffer.sampleRate
      );
      setUndoBuffer(copyOriginal());
      onCanUndo(true);
    }
    insertBuffer(newBuffer, position, position);
  };
  const wsUndo = () => {
    if (undoBuffer) loadDecoded(undoBuffer);
    else wsClear();
    setUndoBuffer(undefined);
    onCanUndo(false);
  };

  //delete the audio in the current region
  const wsRegionDelete = () => {
    if (!currentRegion() || !wavesurfer()) return;
    var start = trimTo(currentRegion().start, 3);
    var end = trimTo(currentRegion().end, 3);
    var len = end - start;
    var backend = wavesurfer()?.backend as any;
    var originalBuffer = backend.buffer;
    setUndoBuffer(copyOriginal());
    onCanUndo(true);

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
    onRegion(0, undefined, true);
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
    wsLoadRegions,
    wsClearRegions,
    wsLoopRegion,
    wsRegionDelete,
    wsUndo,
    wsInsertAudio,
    wsInsertSilence,
    wsZoom,
    wsPctWidth,
    wsGetRegions,
    wsAutoSegment,
    wsPrevRegion,
    wsNextRegion,
    wsSplitRegion,
    wsAddOrRemoveRegion,
    wsRemoveSplitRegion,
    wsStartRecord,
    wsStopRecord,
  };
}
