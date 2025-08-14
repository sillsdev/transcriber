import { debounce } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useWavesurfer } from '@wavesurfer/react';
import Timeline from 'wavesurfer.js/dist/plugins/timeline';
import ZoomPlugin from 'wavesurfer.js/dist/plugins/zoom';
//import RecordPlugin from 'wavesurfer.js/dist/plugins/record';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';

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

const noop = () => {};
const noop1 = (x: any) => {};

export interface IMarker {
  time: number;
  label?: string;
  color?: string;
  position?: 'top' | 'bottom';
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
  currentSegmentIndex?: number,
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
  const wavesurferPlayingRef = useRef(false); //don't trust ws.isPlaying()
  const durationRef = useRef(0);
  const userInteractionRef = useRef(true);
  const [undoBuffer, setUndoBuffer] = useState<AudioBuffer | undefined>();
  const inputRegionsRef = useRef<IRegions>();
  const regionsLoadedRef = useRef(false);
  const markersRef = useRef([] as IMarker[]);

  const audioContextRef = useRef<AudioContext>();
  const fillpxRef = useRef(0);
  const [playerUrl, setPlayerUrl] = useState<string>('');
  const [actualPxPerSec, setActualPxPerSec] = useState(0);

  const plugins = useMemo(() => {
    const regionsPlugin = RegionsPlugin.create();
    setRegions(regionsPlugin);
    return [
      Timeline.create({}),
      ZoomPlugin.create({
        scale: 0.5,
        maxZoom: maxZoom,
      }),
      regionsPlugin,
    ].filter(Boolean);
  }, []);

  //don't use isReady, it's not reliable
  const { wavesurfer, isPlaying, currentTime, isReady } = useWavesurfer({
    container: container, //containerRef as React.RefObject<HTMLDivElement>,
    waveColor: '#A8DBA8',
    progressColor: '#3B8686',
    url: playerUrl,
    height: height,
    normalize: true,
    plugins: plugins,
    fillParent: true, // This ensures the waveform fills the container
  });

  const onRegionPlayStatus = (value: boolean) => {
    playingRef.current = value;
    if (onPlayStatus) onPlayStatus(playingRef.current);
  };
  const wsDuration = () =>
    durationRef.current || wavesurfer?.getDuration() || 0;
  const wsFillPx = () => fillpxRef.current;
  const isNear = (position: number) => {
    return Math.abs(position - progressRef.current) < 0.3;
  };

  const wsGoto = (position: number) => {
    resetPlayingRegion();
    var duration = wsDuration();
    if (position > duration) position = duration;
    onRegionGoTo(position);
    if (duration) position = position / duration;
    if (position === 1 && isPlaying) {
      //if playing, position messages come in after this one that set it back to previously playing position.  Turn this off first in hopes that all messages are done before we set the position...
      wavesurfer?.pause();
      waitForIt(
        'wavesurfer stop',
        () => !isPlaying,
        () => {
          return false;
        },
        100
      )
        .catch()
        .finally(() => {
          userInteractionRef.current = false;
          wavesurfer?.seekTo(position); //seekAndCenter not avail?
          userInteractionRef.current = true;
        });
    } else {
      userInteractionRef.current = false;
      wavesurfer?.seekTo(position); //seekAndCenter not avail?
      userInteractionRef.current = true;
    }
  };

  const progress = () => currentTime;
  const wsPlayRegion = () => setPlayingx(true, true);
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
    wavesurfer,
    onRegion,
    onRegionPlayStatus,
    wsDuration,
    isNear,
    wsGoto,
    progress,
    setPlaying,
    onCurrentRegion,
    onStartRegion,
    verses
  );

  const setPlayingx = (value: boolean, regionOnly: boolean) => {
    playingRef.current = value;
    try {
      if (value) {
        if (isReady) {
          //play region once if single region
          if (!regionOnly || !justPlayRegion(progress())) {
            //default play (which will loop region if looping is on)
            resetPlayingRegion();
            wavesurfer?.playPause();
          }
        }
      } else {
        try {
          if (wavesurferPlayingRef.current) wavesurfer?.pause();
        } catch {
          //ignore
        }
      }
      if (onPlayStatus) onPlayStatus(playingRef.current);
    } catch (error: any) {
      logError(Severity.error, errorReporter, error);
    }
    //}
  };

  //TODO...is there a way to know if destroyed?
  //const wavesurfer = () => wavesurferRef.current;
  //wavesurferRef.current?.isDestroyed ? undefined : wavesurferRef.current;
  const audioContext = () => {
    audioContextRef.current =
      audioContextRef.current ?? new window.AudioContext();
    return audioContextRef.current;
  };
  useEffect(() => {
    setProgress(currentTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime]);

  useEffect(() => {
    const handleReady = () => {
      //recording also sends ready
      if (loadRequests.current > 0) loadRequests.current--;
      if (!loadRequests.current) {
        durationRef.current = wavesurfer?.getDuration() ?? 0;
        if (durationRef.current > 0) {
          const containerWidth = container.current?.clientWidth || 0; // Get the width of the waveform container in pixels.
          // Calculate the actual pixels per second
          const pxPerSec = containerWidth / durationRef.current;
          setActualPxPerSec(pxPerSec);
          fillpxRef.current = Math.round(pxPerSec * 10) / 10;
          onZoom && onZoom(fillpxRef.current);
        } else onZoom && onZoom(maxZoom);
        if (playingRef.current) setPlaying(true);
        onReady();
      } else {
        //requesting load of blob that came in while this one was loading
        wsLoad();
      }
    };

    if (wavesurfer) {
      //setWaveSurfer(wavesurfer);
      wavesurfer.on('ready', handleReady);
      //wavesurfer.on('destroy', function () {
      //  wavesurferRef.current = undefined;
      //});
      /*
      wavesurfer.on(
        'audioprocess',
        _.throttle(function (e: number) {
          if (wavesurferPlayingRef.current) setProgress(e);
        }, 150)
      ); */
      wavesurfer.on('play', function () {
        console.log('play');
        wavesurferPlayingRef.current = true;
      });
      wavesurfer.on('pause', function () {
        wavesurferPlayingRef.current = false;
      });
      wavesurfer.on('seeking', function (e: number) {
        onRegionSeek(e, !userInteractionRef.current);
        console.log('seeking', e, userInteractionRef.current);
      });
      wavesurfer.on('finish', function () {
        //we'll get a pause next, so don't set wavesurferPlayingRef here
        setPlaying(false);
        console.log('finish', wsDuration());
        //setProgress(wsDuration());
      });
      wavesurfer.on('interaction', function () {
        onInteraction();
      });
      /* TODO?
      wavesurfer.on('redraw', function () {
        console.log('redraw', widthRef.current, container.current?.clientWidth);
        if (widthRef.current !== container.current?.clientWidth || 0) {
          widthRef.current = container.current?.clientWidth || 0;
          wsAddMarkers(markersRef.current);
        }
      });
      */
      wavesurfer.on('dblclick', function (e: any, progress: number) {
        console.log('wavesurfer dblclick', e, progress);
        if (!singleRegionOnly) {
          wsAddOrRemoveRegion();
        }
      });
      if (onZoom) {
        wavesurfer.on('zoom', function (px: number) {
          console.log(
            'wavesurfer zoom',
            px,
            actualPxPerSec,
            wavesurfer.options.height
          );
          onZoom(px);
          if (px > actualPxPerSec) {
            console.log('wavesurfer zoom', wavesurfer.options.height);
            wavesurfer.setOptions({
              height: height - 40,
            });
          }
        });
      }

      /* TODO MARKERS
          wavesurfer.on('marker-click', function (marker: any, e: any) {
            //the seek right before this will cause any regions to be removed
            //wait for that...
            if (singleRegionOnly) {
              waitForIt(
                'wavesurfer region clear',
                () => {
                  return wsGetRegions().length <= '{"regions":"[]"}'.length;
                },
                () => false,
                100
              )
                .catch()
                .finally(() => {
                  onMarkerClick(marker.time);
                });
            } else {
              setTimeout(() => {
                onMarkerClick(marker.time);
              }, 500);
            }
          });
          */
      /* TODO
       ws.drawer.on('click', (event: any, progress: number) => {
       });
      */

      if (blobToLoad.current) {
        wsLoad();
      }
      onCanUndo && onCanUndo(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container, wavesurfer]);

  useEffect(() => {
    // Removes events, elements and disconnects Web Audio nodes on component unmount
    return () => {
      blobToLoad.current = undefined;
      if (wavesurfer) {
        var ws = wavesurfer;
        if (wavesurferPlayingRef.current) ws.stop();
        wavesurferPlayingRef.current = false;
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

  const wsClear = (preventUndo: boolean = false) => {
    if (loadRequests.current) {
      //queue this
      blobToLoad.current = undefined;
      loadRequests.current = 2; //if there was another, we'll bypass it
      return;
    }
    if (wavesurferPlayingRef.current) wavesurfer?.stop();
    if (!preventUndo) {
      setUndoBuffer(copyOriginal());
    } else setUndoBuffer(undefined);
    onCanUndo(!preventUndo);
    wavesurfer?.load('');
    durationRef.current = 0;
    clearRegions();
    wsGoto(0);
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
    if (rate !== wavesurfer?.getPlaybackRate()) {
      wavesurfer?.setPlaybackRate(rate);
    }
  };
  const wsZoom = debounce((zoom: number) => {
    console.log('wavesurfer wszoom debounced', zoom);
    if (isReady) wavesurfer?.zoom(zoom);
  }, 10);
  const loadBlob = async (blob: Blob) => {
    const blobUrl = URL.createObjectURL(blob);
    setPlayerUrl(blobUrl);
    //await wavesurfer?.load(blobUrl);
    //URL.revokeObjectURL(blobUrl);
  };
  const wsLoad = (blob?: Blob, regions: string = '') => {
    durationRef.current = 0;
    if (regions) inputRegionsRef.current = parseRegions(regions);
    regionsLoadedRef.current = false;
    if (!wavesurfer) {
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
      wsClear();
    }
  };
  useEffect(() => {
    if (!regionsLoadedRef.current) {
      //we need to call this even if undefined to setup regions variables
      regionsLoadedRef.current = loadRegions(inputRegionsRef.current, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const wsLoadRegions = (regions: string, loop: boolean) => {
    if (isReady) {
      loadRegions(parseRegions(regions), loop);
      regionsLoadedRef.current = true;
    } else {
      inputRegionsRef.current = parseRegions(regions);
      regionsLoadedRef.current = false;
    }
  };
  const wsClearRegions = () => {
    if (isReady) {
      clearRegions();
    } else {
      inputRegionsRef.current = undefined;
    }
  };
  const wsBlob = async () => {
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
    const originalBuffer = wavesurfer?.getDecodedData();
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
    userInteractionRef.current = false;
    wavesurfer?.skip(amt);
  };

  const wsSetHeight = (height: number) =>
    wavesurfer?.setOptions({
      height: height, // Sets the waveform height to 300 pixels
    });

  const trimTo = (val: number, places: number) => {
    var dec = places > 0 ? 10 ** places : 1;
    return ((val * dec) >> 0) / dec;
  };

  async function loadDecoded(audioBuffer: any) {
    const url = URL.createObjectURL(
      new Blob([audioBuffer], { type: 'audio/wav' })
    );
    /*
    const peaks = [
      audioBuffer.getChannelData(0),
      audioBuffer.getChannelData(1),
    ];
    const duration = audioBuffer.duration;
    */
    await wavesurfer?.load(url);
  }
  const copyOriginal = () => {
    if (!wavesurfer) return undefined;
    //var backend = wavesurfer?.backend as any;
    //var originalBuffer = backend?.buffer;
    const originalBuffer = wavesurfer?.getDecodedData();
    if (originalBuffer) {
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
  const insertBuffer = async (
    newBuffer: any,
    startposition: number,
    endposition: number
  ) => {
    if (!wavesurfer) return 0;
    //var backend = wavesurfer?.backend as any;
    //var originalBuffer = backend.buffer;
    const originalBuffer = wavesurfer?.getDecodedData();
    if (
      !originalBuffer ||
      (startposition === 0 && (originalBuffer?.length | 0) === 0)
    ) {
      await loadDecoded(newBuffer);
      return newBuffer ? newBuffer.length / newBuffer.sampleRate : 0;
    }
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
    await loadDecoded(uberSegment);
    durationRef.current = wavesurfer?.getDuration() || 0;
    return (start_offset + newBuffer.length) / originalBuffer.sampleRate;
  };

  const wsInsertAudio = async (
    blob: Blob,
    position: number,
    overwriteToPosition: number,
    mimeType?: string
  ) => {
    var buffer = await blob.arrayBuffer();
    if (!wavesurfer) throw new Error('wavesurfer closed'); //closed while we were working on the blob
    if (buffer.byteLength === 1) return position;
    try {
      const blobAudioBuffer = await decodeAudioData(audioContext(), buffer);
      return await insertBuffer(blobAudioBuffer, position, overwriteToPosition);
    } catch (error: any) {
      logError(Severity.error, errorReporter, error);
      throw error;
    }
  };
  const wsStartRecord = () => {
    setUndoBuffer(copyOriginal());
  };
  const wsStopRecord = () => {
    onCanUndo(true);
  };

  const wsInsertSilence = (seconds: number, position: number) => {
    if (!wavesurfer) return;
    const originalBuffer = wavesurfer?.getDecodedData();
    if (originalBuffer) {
      var new_len = ((seconds / 1.0) * originalBuffer.sampleRate) >> 0;
      var newBuffer = audioContext().createBuffer(
        originalBuffer.numberOfChannels,
        new_len,
        originalBuffer.sampleRate
      );
      setUndoBuffer(copyOriginal());
      onCanUndo(true);
      insertBuffer(newBuffer, position, position);
    }
  };
  const wsUndo = async () => {
    if (undoBuffer) await loadDecoded(undoBuffer);
    else {
      wsClear();
    }
    //reset any region
    clearRegions();
    setUndoBuffer(undefined);
    onCanUndo(false);
  };
  const wsAddMarkers = (markers: IMarker[]) => {
    markersRef.current = markers;
    /* TODO MARKERS
    wavesurfer?.clearMarkers();
    markers.forEach((m) => {
      wavesurfer?.addMarker(m);
    });
    */
  };

  //delete the audio in the current region
  const wsRegionDelete = async () => {
    if (!currentRegion() || !wavesurfer) return;
    var start = trimTo(currentRegion().start, 3);
    var end = trimTo(currentRegion().end, 3);
    var len = end - start;
    if (!len) return wsClear();
    const originalBuffer = wavesurfer?.getDecodedData();
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

    await loadDecoded(uberSegment);
    Regions?.clearRegions();
    onRegion(0, true);
    var tmp = start - 0.03;
    if (tmp < 0) tmp = 0;
    wsGoto(tmp);
    durationRef.current = wavesurfer?.getDuration() || 0;
    return emptySegment;
  };
  // Helper function to read a Blob as an ArrayBuffer
  function readFileAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }
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
    if (!wavesurfer) return;
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
    const originalBuffer = wavesurfer?.getDecodedData();
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
    // Load the new buffer into Wavesurfer
    await loadDecoded(combinedBuffer);
    return await wsBlob();
  };

  return {
    isReady,
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
    wsInsertSilence,
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
