import { debounce } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useWavesurfer } from '@wavesurfer/react';
import Timeline from 'wavesurfer.js/dist/plugins/timeline';
import ZoomPlugin from 'wavesurfer.js/dist/plugins/zoom';
//import RecordPlugin from 'wavesurfer.js/dist/plugins/record';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import toWav from 'audiobuffer-to-wav';

import { logError, Severity } from '../utils/logErrorService';
import { waitForIt } from '../utils/waitForIt';
import {
  IRegion,
  IRegions,
  parseRegions,
  useWaveSurferRegions,
} from './useWavesurferRegions';
import { convertToWav } from '../utils/wav';
import { useGlobal } from '../context/GlobalContext';
import { maxZoom } from '../components/WSAudioPlayerZoom';
import WaveSurfer from 'wavesurfer.js';

const noop = () => {};
const noop1 = (x: any) => {};

export interface IMarker {
  time: number;
  label?: string;
  color?: string;
  //position?: 'top' | 'bottom';
}

export function useWaveSurfer(
  container: any,
  onReady: () => void = noop,
  onProgress: (progress: number) => void = noop1,
  onRegion: (count: number, newRegion: boolean) => void = noop1,
  onCanUndo: (canUndo: boolean) => void = noop1,
  onPlayStatus: (playing: boolean) => void = noop,
  onInteraction: () => void = noop,
  onZoom: undefined | ((px: number) => void),
  onMarkerClick: (time: number) => void = noop1,
  onError: (e: any) => void = noop,
  height: number,
  singleRegionOnly: boolean = false,
  currentSegmentIndex?: number | undefined,
  onCurrentRegion?: (currentRegion: IRegion | undefined) => void,
  onStartRegion?: (start: number) => void,
  verses?: string
) {
  //const isMounted = useMounted('wavesurfer');
  const [errorReporter] = useGlobal('errorReporter');
  const progressRef = useRef(0);
  const [Regions, setRegions] = useState<RegionsPlugin>();
  const blobToLoad = useRef<Blob>();
  const loadRequests = useRef(0);
  const playingRef = useRef(false);

  const durationRef = useRef(0);
  const isReadyRef = useRef(false);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const isPlayingRef = useRef(false);
  const [undoBuffer, setUndoBuffer] = useState<AudioBuffer | undefined>();
  const inputRegionsRef = useRef<IRegions>();
  const regionsLoadedRef = useRef(false);
  const markersRef = useRef([] as IMarker[]);

  const audioContextRef = useRef<AudioContext>();
  const fillpxRef = useRef(0);
  const [playerUrl, setPlayerUrl] = useState<string>('');
  const [actualPxPerSec, setActualPxPerSec] = useState(0);
  const blobRef = useRef<Blob>();
  const blobAudioRef = useRef<AudioBuffer>();
  const positionRef = useRef(-1);
  const [recording, setRecordingx] = useState(false);
  const recordingRef = useRef(false);
  const plugins = useMemo(() => {
    const regionsPlugin = RegionsPlugin.create();
    setRegions(regionsPlugin);

    const zoomPlugin = onZoom
      ? ZoomPlugin.create({
          scale: 0.5,
          maxZoom: maxZoom,
        })
      : undefined;
    if (zoomPlugin)
      return [Timeline.create({}), zoomPlugin, regionsPlugin].filter(Boolean);
    return [Timeline.create({}), regionsPlugin].filter(Boolean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //put these all in refs to be used in functions
  const { wavesurfer, isPlaying, currentTime, isReady } = useWavesurfer({
    container: container, //containerRef as React.RefObject<HTMLDivElement>,
    progressColor: '#3B8686',
    cursorColor: '#1b0707',
    url: playerUrl,
    height: height,
    normalize: true,
    plugins: plugins,
    fillParent: true, // This ensures the waveform fills the container
  });

  useEffect(() => {
    wavesurferRef.current = wavesurfer;
  }, [wavesurfer]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  useEffect(() => {
    const setProgress = (value: number) => {
      progressRef.current = value;
      onRegionProgress(value);
      onProgress(value);
    };

    setProgress(currentTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime]);

  const onRegionPlayStatus = (value: boolean) => {
    playingRef.current = value;
    if (onPlayStatus) onPlayStatus(playingRef.current);
  };

  const wsDuration = () => durationRef.current || 0;
  const wsFillPx = () => fillpxRef.current;
  const isNear = (position: number) => {
    return Math.abs(position - progressRef.current) < 0.3;
  };

  const wsGoto = async (position: number) => {
    resetPlayingRegion();
    var duration = wsDuration();
    if (position > duration) position = duration;
    onRegionGoTo(position);
    //if (duration) position = position / duration;
    if (position === duration && isPlayingRef.current) {
      //if playing, position messages come in after this one that set it back to previously playing position.  Turn this off first in hopes that all messages are done before we set the position...
      wavesurferRef.current?.pause();
      await waitForIt(
        'wavesurfer stop',
        () => !isPlayingRef.current,
        () => {
          return false;
        },
        100
      );
    }
    if (progress() !== position) {
      wavesurferRef.current?.setTime(position); //seekAndCenter not avail?
      //force a redraw
      //wavesurferRef.current?.setOptions({});
    }
    console.log('wsGoto done', wavesurferRef.current?.getCurrentTime());
  };

  const progress = () => progressRef.current;
  const setPlaying = (value: boolean) => setPlayingx(value, singleRegionOnly);

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
    wsAddMarker,
    wsClearMarkers,
    wsPlayRegion,
    wsLoopRegion,
    justPlayRegion,
    resetPlayingRegion,
    onRegionSeek,
    onRegionProgress,
    onRegionGoTo,
    currentRegion,
  } = useWaveSurferRegions(
    singleRegionOnly,
    currentSegmentIndex ?? -1,
    Regions,
    wavesurferRef.current,
    onRegion,
    wsDuration,
    isNear,
    wsGoto,
    progress,
    () => isPlayingRef.current,
    setPlaying,
    onCurrentRegion,
    onStartRegion,
    onMarkerClick,
    verses
  );

  const setPlayingx = (value: boolean, regionOnly: boolean) => {
    console.log('setPlayingx', value, regionOnly);
    playingRef.current = value;
    try {
      if (value) {
        if (isReadyRef.current) {
          //play region once if single region
          let playingRegion = regionOnly ? justPlayRegion(progress()) : false;
          if (!playingRegion) {
            //default play (which will loop region if looping is on)
            resetPlayingRegion();
            if (!wavesurferRef.current?.isPlaying())
              wavesurferRef.current?.play();
          }
        }
      } else {
        try {
          if (isPlayingRef.current) wavesurferRef.current?.pause();
        } catch {
          //ignore
        }
      }
      if (onPlayStatus) onPlayStatus(playingRef.current);
    } catch (error: any) {
      logError(Severity.error, errorReporter, error);
    }
  };

  //TODO...is there a way to know if destroyed?
  //const wavesurfer = () => wavesurferRef.current;
  //wavesurferRef.current?.isDestroyed ? undefined : wavesurferRef.current;
  const audioContext = () => {
    audioContextRef.current =
      audioContextRef.current ?? new window.AudioContext();
    return audioContextRef.current;
  };

  const setupZoom = () => {
    // set up zoom
    if (durationRef.current > 0 && !recordingRef.current) {
      const containerWidth = container.current?.clientWidth || 0; // Get the width of the waveform container in pixels.
      // Calculate the actual pixels per second
      const pxPerSec = containerWidth / durationRef.current;
      setActualPxPerSec(pxPerSec);
      fillpxRef.current = Math.round(pxPerSec * 10) / 10;
      onZoom && onZoom(fillpxRef.current);
    } else {
      onZoom && onZoom(maxZoom);
      // Set data attribute to 0 when no audio
    }
  };
  useEffect(() => {
    const handleReady = () => {
      console.log(
        'handleReady getDuration',
        wavesurferRef.current?.getDuration(),
        'durationRef.current',
        durationRef.current,
        'positionRef.current',
        positionRef.current
      );
      //recording also sends ready
      if (loadRequests.current > 0) loadRequests.current--;
      if (!loadRequests.current) {
        if (!regionsLoadedRef.current) {
          //we need to call this even if undefined to setup regions variables
          regionsLoadedRef.current = loadRegions(
            inputRegionsRef.current,
            false
          );
        }
        setupZoom();
        if (playingRef.current) setPlaying(true);
        if (positionRef.current >= 0) wsGoto(positionRef.current);
        else wsGoto(durationRef.current);
        onReady();
      } else {
        //requesting load of blob that came in while this one was loading
        wsLoad();
      }
    };
    console.log('wavesurfer useEffect');
    regionsLoadedRef.current = false;
    if (wavesurfer) {
      //setWaveSurfer(wavesurfer);
      wavesurfer.on('ready', handleReady);
      //wavesurferRef.current.on('destroy', function () {
      //  wavesurferRef.current = undefined;
      //});

      /* if dragging this never comes and we don't need it otherwise
      wavesurferRef.current.on('click', function (relativeX: number) {
        console.log(
          'click',
          relativeX,
          relativeX * durationRef.current,
          progressRef.current
        );
        wsGoto(relativeX * durationRef.current);
      });
      */
      wavesurfer.on('seeking', function (e: number) {
        console.log('seeking', e);
        onRegionSeek(e, true);
      });
      wavesurfer.on('finish', function () {
        //we'll get a pause next, so don't set isPlayingRef here
        setPlaying(false);
        console.log('finish', wsDuration());
      });
      wavesurfer.on('interaction', function (newTime: number) {
        console.log('interaction', newTime);
        onInteraction();
      });
      /* TODO?
      wavesurferRef.current.on('redraw', function () {
        console.log('redraw', widthRef.current, container.current?.clientWidth);
        if (widthRef.current !== container.current?.clientWidth || 0) {
          widthRef.current = container.current?.clientWidth || 0;
          wsAddMarkers(markersRef.current);
        }
      });
      */
      wavesurfer.on('dblclick', (relativeX: number, relativeY: number) => {
        // relativeX and relativeY represent the coordinates of the double-click
        // You can use these to determine where on the waveform the double-click occurred
        if (!singleRegionOnly) {
          wsAddOrRemoveRegion();
        }
      });

      if (onZoom) {
        wavesurfer.on('zoom', function (px: number) {
          console.log(
            'wavesurfer zoom',
            durationRef.current,
            px,
            actualPxPerSec,
            wavesurfer.options.height
          );
          onZoom(px);
          if (px > actualPxPerSec) {
            wavesurfer.setOptions({
              height: height - 40,
            });
          }
        });
      }
      if (blobToLoad.current) {
        wsLoad();
      }
      onCanUndo && onCanUndo(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wavesurfer]);

  useEffect(() => {
    // Removes events, elements and disconnects Web Audio nodes on component unmount
    return () => {
      blobToLoad.current = undefined;
      if (wavesurferRef.current) {
        var ws = wavesurferRef.current;
        if (isPlayingRef.current) ws.stop();
        isPlayingRef.current = false;
        ws.unAll();
        ws.destroy();
        wavesurferRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDuration = (value: number) => {
    durationRef.current = value;
    // Set data attribute for cursor styling
    container.current?.setAttribute('data-duration', value.toString());
  };

  const wsClear = (preventUndo: boolean = false) => {
    if (loadRequests.current) {
      //queue this
      blobToLoad.current = undefined;
      loadRequests.current = 2; //if there was another, we'll bypass it
      return;
    }
    if (isPlayingRef.current) wavesurferRef.current?.stop();
    if (!preventUndo) {
      setUndoBuffer(copyOriginal());
    } else setUndoBuffer(undefined);
    onCanUndo(!preventUndo);
    clearRegions();
    wsGoto(0);
    loadBlob();
    setDuration(0);
    onReady();
  };

  const wsIsPlaying = () => playingRef.current;

  const wsTogglePlay = () => {
    setPlaying(!playingRef.current);
    return playingRef.current;
  };

  const wsPlay = () => setPlaying(true);

  const wsPause = () => setPlaying(false);

  const wsPosition = () => progressRef.current;

  const wsSetPlaybackRate = (rate: number) => {
    if (rate !== wavesurferRef.current?.getPlaybackRate()) {
      wavesurferRef.current?.setPlaybackRate(rate);
    }
  };
  const wsZoom = debounce((zoom: number) => {
    if (isReadyRef.current) wavesurferRef.current?.zoom(zoom);
  }, 10);

  const loadBlob = async (blob?: Blob, position: number = 0) => {
    // setIsReady(false);
    positionRef.current = position;
    if (!blob) {
      setPlayerUrl('');
      blobAudioRef.current = undefined;
      blobRef.current = undefined;
      setDuration(0);
      return;
    }
    const blobUrl = URL.createObjectURL(blob);
    setPlayerUrl(blobUrl);
    blobRef.current = blob;
    blobAudioRef.current = await decodeAudioData(
      audioContext(),
      await blob.arrayBuffer()
    );
    console.log(
      'loadBlob calculated duration',
      blobAudioRef.current?.length / blobAudioRef.current?.sampleRate,
      'blobAudioRef.current?.duration',
      blobAudioRef.current?.duration
    );
    setDuration(
      blobAudioRef.current?.length / blobAudioRef.current?.sampleRate || 0
    );
  };
  const wsLoad = (blob?: Blob, regions: string = '') => {
    setDuration(0);
    if (regions) inputRegionsRef.current = parseRegions(regions);
    regionsLoadedRef.current = false;
    if (!wavesurferRef.current) {
      blobToLoad.current = blob;
      loadRequests.current = 1;
    } else if (blob) {
      if (loadRequests.current) {
        //queue this
        blobToLoad.current = blob;
        loadRequests.current = 2; //if there was another, we'll bypass it
      } else {
        loadBlob(blob).then(() => console.log('loaded'));
        loadRequests.current = 1;
      }
    } else if (blobToLoad.current) {
      loadBlob(blobToLoad.current).then(() => console.log('loaded initial'));
      blobToLoad.current = undefined;
    } else {
      loadRequests.current--;
      console.log('wsLoad', 'no blob so clear');
      wsClear();
    }
  };

  const wsLoadRegions = (regions: string, loop: boolean) => {
    if (isReadyRef.current) {
      loadRegions(parseRegions(regions), loop);
      regionsLoadedRef.current = true;
    } else {
      inputRegionsRef.current = parseRegions(regions);
      regionsLoadedRef.current = false;
    }
  };
  const wsClearRegions = () => {
    if (isReadyRef.current) {
      clearRegions();
    } else {
      inputRegionsRef.current = undefined;
    }
  };
  const wsBlob = async () => {
    return blobRef.current;
    /*
        //var backend = wavesurfer?.backend as any;
    //var originalBuffer = backend?.buffer;
    const originalBuffer = wavesurfer?.getDecodedData();
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
      var wavblob = await convertToWav(data_left, data_right, {
        isFloat: true, // floating point or 16-bit integer (WebAudio API decodes to Float32Array) ???
        numChannels: channels,
        sampleRate: originalBuffer.sampleRate,
      });
      return wavblob;
    }
    return undefined;
    */
  };

  const wsRegionBlob = async () => {
    if (!wavesurfer) return;
    if (!currentRegion()) return wsBlob();
    var start = trimTo(currentRegion().start, 3);
    var end = trimTo(currentRegion().end, 3);
    var len = end - start;
    if (!len) return wsBlob();

    //var backend = wavesurfer?.backend as any;
    //var originalBuffer = backend.buffer;
    const originalBuffer = blobAudioRef.current;
    if (!originalBuffer) return wsBlob();
    // Get the original audio buffer

    // Calculate the number of frames for the region
    const startFrame = Math.floor(start * originalBuffer.sampleRate);
    const endFrame = Math.floor(end * originalBuffer.sampleRate);
    const frameCount = endFrame - startFrame;

    // Create a new buffer for the region
    const regionBuffer = audioContext().createBuffer(
      originalBuffer.numberOfChannels,
      frameCount,
      originalBuffer.sampleRate
    );

    // Copy the audio data for the region
    for (
      let channel = 0;
      channel < originalBuffer.numberOfChannels;
      channel++
    ) {
      const originalData = originalBuffer.getChannelData(channel);
      const regionData = regionBuffer.getChannelData(channel);
      regionData.set(originalData.subarray(startFrame, endFrame));
    }
    var channels = regionBuffer.numberOfChannels;
    var data_left = regionBuffer.getChannelData(0);
    var data_right = null;
    if (channels === 2) {
      data_right = regionBuffer.getChannelData(1);
      if (!data_left && data_right) {
        data_left = data_right;
        data_right = null;
        channels = 1;
      }
    }
    // Convert the region buffer to a Blob
    var wavblob = await convertToWav(data_left, data_right, {
      isFloat: true, // floating point or 16-bit integer (WebAudio API decodes to Float32Array) ???
      numChannels: channels,
      sampleRate: originalBuffer.sampleRate,
    });
    return wavblob;
  };

  const wsSkip = (amt: number) => {
    wavesurferRef.current?.skip(amt);
  };

  const wsSetHeight = (height: number) =>
    wavesurferRef.current?.setOptions({
      height: height, // Sets the waveform height to 300 pixels
    });

  const trimTo = (val: number, places: number) => {
    var dec = places > 0 ? 10 ** places : 1;
    return ((val * dec) >> 0) / dec;
  };

  /**
   * Encodes an AudioBuffer to a WAV Blob.
   */
  function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    // Get ArrayBuffer from AudioBuffer
    const wavArrayBuffer = toWav(buffer) as ArrayBuffer;
    // Create a Blob with type 'audio/wav'
    return new Blob([wavArrayBuffer], { type: 'audio/wav' });
  }
  async function loadDecoded(audioBuffer: any, position: number) {
    loadBlob(audioBufferToWavBlob(audioBuffer), position);
  }
  const copyOriginal = () => {
    if (!wavesurferRef.current) return undefined;
    //var backend = wavesurfer?.backend as any;
    //var originalBuffer = backend?.buffer;
    const originalBuffer = blobAudioRef.current;
    if (originalBuffer && originalBuffer.length > 1) {
      var len = originalBuffer.length;
      var uberSegment = undefined;

      uberSegment = audioContext().createBuffer(
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
    } else return undefined;
  };
  const insertBlob = async (
    blob: Blob,
    startposition: number,
    endposition: number | undefined
  ) => {
    if (!wavesurferRef.current) return 0;
    var newBuffer = await decodeAudioData(
      audioContext(),
      await blob.arrayBuffer()
    );
    console.log(
      'insertBlob newBuffer duration',
      newBuffer?.length / newBuffer?.sampleRate,
      newBuffer?.duration
    );
    if (endposition === undefined || !blobAudioRef.current) {
      let position = newBuffer ? newBuffer.length / newBuffer.sampleRate : 0;
      loadBlob(blob, position);
      return position;
    }
    const originalBuffer = blobAudioRef.current;

    if (!originalBuffer) return 0;
    var start_offset = (startposition * originalBuffer.sampleRate) >> 0;
    var after_offset = (endposition * originalBuffer.sampleRate) >> 0;
    var after_len = originalBuffer.length - after_offset;
    if (after_len < 0) after_len = 0;
    var new_len = start_offset + newBuffer.length + after_len;

    var uberSegment = null;
    uberSegment = audioContext().createBuffer(
      originalBuffer.numberOfChannels,
      new_len,
      originalBuffer.sampleRate
    );
    for (var ix = 0; ix < originalBuffer.numberOfChannels; ++ix) {
      var chan_data = originalBuffer.getChannelData(ix);
      var new_data = newBuffer.getChannelData(
        ix < newBuffer.numberOfChannels ? ix : newBuffer.numberOfChannels - 1
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
    let position =
      (start_offset + newBuffer.length) / originalBuffer.sampleRate;
    await loadDecoded(uberSegment, position);

    return position;
  };

  const wsInsertAudio = async (
    blob: Blob,
    position: number,
    overwriteToPosition: number | undefined,
    mimeType?: string
  ) => {
    console.log(
      'wsInsertAudio position',
      position,
      'overwriteToPosition',
      overwriteToPosition,
      'mimeType',
      mimeType,
      'wavesurfer duration',
      durationRef.current,
      wavesurferRef.current?.getDuration(),
      wavesurferRef.current?.getCurrentTime()
    );
    if (!wavesurferRef.current) throw new Error('wavesurfer closed'); //closed while we were working on the blob
    if (blob.size === 0) return position;
    try {
      return await insertBlob(blob, position, overwriteToPosition);
    } catch (error: any) {
      logError(Severity.error, errorReporter, error);
      throw error;
    }
  };
  useEffect(() => {
    const getWaveColor = () => {
      if (recording) return '#eea810';
      if (isPlayingRef.current) return '#44ff44';
      return '#A8DBA8';
    };
    wavesurferRef.current?.setOptions({
      waveColor: getWaveColor(),
    });
  }, [recording, isPlaying, wavesurfer]);

  const setRecording = (value: boolean) => {
    setRecordingx(value);
    recordingRef.current = value;
  };
  const wsStartRecord = () => {
    setUndoBuffer(copyOriginal());
    setRecording(true);
  };
  const wsStopRecord = () => {
    onCanUndo(true);
    setRecording(false);
  };

  const wsUndo = async () => {
    console.log('wsUndo', undoBuffer?.length);
    if (undoBuffer) await loadDecoded(undoBuffer, 0);
    else {
      wsClear();
    }
    //reset any region
    clearRegions();
    setUndoBuffer(undefined);
    onCanUndo(false);
  };
  const wsAddMarkers = (markers: IMarker[]) => {
    console.log('wsAddMarkers', markers);
    markersRef.current = markers;
    if (isReadyRef.current) {
      wsClearMarkers();

      markers.forEach((m, i) => {
        wsAddMarker(m, i);
      });
    }
  };

  //delete the audio in the current region
  const wsRegionDelete = async () => {
    console.log('wsRegionDelete', currentRegion());
    if (!currentRegion() || !wavesurferRef.current) return;
    var start = trimTo(currentRegion().start, 3);
    var end = trimTo(currentRegion().end, 3);
    currentRegion().remove();
    var len = end - start;
    console.log('wsRegionDelete', len);
    if (!len) return wsClear();
    const originalBuffer = blobAudioRef.current;
    if (!originalBuffer) return null;
    setUndoBuffer(copyOriginal());
    onCanUndo(true);
    var new_len = ((len / 1) * originalBuffer.sampleRate) >> 0;
    var new_offset = ((start / 1) * originalBuffer.sampleRate) >> 0;
    var emptySegment = audioContext().createBuffer(
      originalBuffer.numberOfChannels,
      new_len,
      originalBuffer.sampleRate
    );
    var uberSegment = null;
    uberSegment = audioContext().createBuffer(
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

    var tmp = start - 0.03;
    if (tmp < 0) tmp = 0;
    await loadDecoded(uberSegment, tmp);
    onRegion(0, true);
    return emptySegment;
  };

  // Helper function to decode audio data
  function decodeAudioData(
    audioContext: AudioContext,
    arrayBuffer: ArrayBuffer
  ): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      audioContext.decodeAudioData(arrayBuffer, resolve, reject);
    });
  }
  const wsRegionReplace = async (blob: Blob) => {
    if (!wavesurferRef.current) return;
    setUndoBuffer(copyOriginal());
    onCanUndo(true);

    if (!currentRegion()) {
      wsLoad(blob);
      return blob;
    }
    var start = trimTo(currentRegion().start, 3);
    var end = trimTo(currentRegion().end, 3);
    var len = end - start;
    if (!len) {
      wsLoad(blob);
      return blob;
    }

    //var backend = wavesurfer?.backend as any;
    //const audioContext = backend.ac;

    //var originalBuffer = backend.buffer;
    const originalBuffer = blobAudioRef.current;
    if (!originalBuffer) return await wsBlob();

    // Load the new Blob and replace the region
    //const arrayBuffer = await readFileAsArrayBuffer(blob);
    const newBuffer = await decodeAudioData(
      audioContext(),
      await blob.arrayBuffer()
    );

    // Create a new buffer with the combined audio data
    var newLength =
      originalBuffer.length -
      (end - start) * originalBuffer.sampleRate +
      newBuffer.length;
    var combinedBuffer = audioContext().createBuffer(
      originalBuffer.numberOfChannels,
      newLength,
      originalBuffer.sampleRate
    );
    // Copy the original audio data up to the start of the region
    for (
      let channel = 0;
      channel < originalBuffer.numberOfChannels;
      channel++
    ) {
      const originalData = originalBuffer.getChannelData(channel);
      const combinedData = combinedBuffer.getChannelData(channel);

      combinedData.set(
        originalData.subarray(0, start * originalBuffer.sampleRate)
      );

      // Copy the new audio data
      if (channel < newBuffer.numberOfChannels)
        combinedData.set(
          newBuffer.getChannelData(channel),
          start * originalBuffer.sampleRate
        );
      else
        combinedData.set(
          newBuffer.getChannelData(0),
          start * originalBuffer.sampleRate
        );

      // Copy the original audio data after the end of the region
      combinedData.set(
        originalData.subarray(end * originalBuffer.sampleRate),
        start * originalBuffer.sampleRate + newBuffer.length
      );
    }
    let position = (start + newBuffer.length) / originalBuffer.sampleRate;
    // Load the new buffer into Wavesurfer
    await loadDecoded(combinedBuffer, position);
    return await wsBlob();
  };

  return {
    wsLoad,
    wsBlob,
    wsRegionBlob,
    wsClear,
    wsIsPlaying,
    wsTogglePlay,
    wsPlay,
    wsPlayRegion,
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
    wsRegionReplace,
    wsUndo,
    wsInsertAudio,
    wsZoom,
    wsFillPx,
    wsGetRegions,
    wsAutoSegment,
    wsPrevRegion,
    wsNextRegion,
    wsSplitRegion,
    wsAddOrRemoveRegion,
    wsRemoveSplitRegion,
    wsStartRecord,
    wsStopRecord,
    wsAddMarkers,
  };
}
