import _ from 'lodash';
import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { createWaveSurfer } from '../components/WSAudioPlugins';
import { useMounted } from '../utils';
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
  singleRegion: boolean = false,
  timelineContainer?: any
) {
  const isMounted = useMounted('wavesurfer');
  const progressRef = useRef(0);
  const wsRef = useRef<WaveSurfer>();
  const blobToLoad = useRef<Blob>();
  const blobTypeRef = useRef('');
  const playingRef = useRef(false);
  const currentRegionRef = useRef<any>();
  const regionPlayingRef = useRef(false);
  const keepRegion = useRef(false);
  const singleRegionRef = useRef(false);
  const durationRef = useRef(0);
  const peaksRef = useRef<
    ReadonlyArray<number> | ReadonlyArray<ReadonlyArray<number>>
  >();
  const inputRegionsRef = useRef<{ start: number; end: number }[]>();
  const autoSegRef = useRef(false);

  useEffect(() => {
    function create(container: any, height: number, singleRegion: boolean) {
      var ws = createWaveSurfer(container, height, timelineContainer);
      wsRef.current = ws;
      singleRegionRef.current = singleRegion;
      ws.on('ready', function () {
        durationRef.current = ws.getDuration();
        if (inputRegionsRef.current) {
          loadRegions(inputRegionsRef.current);
        } else if (autoSegRef.current) wsAutoSegment();

        /* ws.enableDragSelection({
          color: randomColor(0.1),
        });*/
        onReady();
      });
      ws.on(
        'audioprocess',
        _.throttle(function (e: number) {
          setProgress(e);
        }, 150)
      );
      ws.on('seek', function (e: number) {
        console.log('seek', e, e * durationRef.current);
        if (!keepRegion.current && currentRegionRef.current) {
          currentRegionRef.current?.remove();
          currentRegionRef.current = undefined;
          if (onRegion) onRegion(false);
        }
        setProgress(e * durationRef.current);
      });
      ws.on('finish', function () {
        setPlaying(false);
        onStop();
      });
      ws.on('region-created', function (r: any) {
        if (singleRegionRef.current && currentRegionRef.current)
          currentRegionRef.current?.remove();
        currentRegionRef.current = r;
        if (onRegion) onRegion(true);
      });
      ws.on('region-update-end', function (r: any) {
        console.log('region-update-end', r, currentRegionRef.current);
        if (singleRegionRef.current) {
          wsGoto(currentRegionRef.current.start);
          keepRegion.current = false;
        }
      });
      /* other potentially useful messages
      ws.on('loading', function (progress) {
        console.log('loading', progress);
      });*/
      ws.on('region-play', function (r: any) {
        console.log('region-play', r);
      });
      ws.on('region-in', function (r: any) {
        console.log('region-in');
        currentRegionRef.current = r;
      });
      ws.on('region-out', function (r: any) {
        console.log('region-out');
      });
      ws.on('region-click', function (r: any) {
        console.log('region-click', r);
        currentRegionRef.current = r;
      });
      ws.on('region-dblclick', function (r: any) {
        console.log('region-dblclick', r);
      });

      return ws;
    }
    if (container && !wsRef.current) {
      create(container, height, singleRegion);
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
      if (wsRef.current) {
        wsRef.current.unAll();
        wsRef.current.destroy();
        wsRef.current = undefined;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isMounted()) return;
    if (wsRef.current?.isReady && playingRef.current) setPlaying(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsRef.current?.isReady]);

  const isInRegion = (r: any, value: number) => {
    return value <= r.end && value >= r.start;
  };
  const findRegion = (value: number) => {
    if (currentRegionRef.current && isInRegion(currentRegionRef.current, value))
      return currentRegionRef.current;
    var foundIt = undefined;
    Object.keys(wsRef.current?.regions.list).forEach(function (id) {
      let r = wsRef.current?.regions.list[id];
      if (r.start <= value && r.end >= value) {
        foundIt = r;
      }
    });
    return foundIt;
  };
  const setProgress = (value: number) => {
    console.log('setProgress', value, currentRegionRef.current);
    progressRef.current = value;
    onProgress(value);
    if (currentRegionRef.current) {
      if (
        value >= currentRegionRef.current.end - 0.01 ||
        value <= currentRegionRef.current.start
      ) {
        if (regionPlayingRef.current) {
          //turning off region play
          regionPlayingRef.current = false;
          playingRef.current = false;
          onStop();
        }
        //currentRegionRef.current = findRegion(value);
      }
    } // else currentRegionRef.current = findRegion(value);
  };

  const setPlaying = (value: boolean) => {
    playingRef.current = value;
    if (playingRef.current) {
      if (wsRef.current?.isReady) {
        if (
          currentRegionRef.current &&
          !currentRegionRef.current.loop &&
          currentRegionRef.current.start <= progressRef.current &&
          currentRegionRef.current.end > progressRef.current + 0.01
        ) {
          //play region once
          regionPlayingRef.current = true;
          currentRegionRef.current.play(progressRef.current);
        } else {
          //default play (which will loop region if looping is on)
          wsRef.current?.play(progressRef.current);
        }
      }
    } else if (wsRef.current?.isPlaying()) wsRef.current?.pause();
  };
  const wsClear = () => wsRef.current?.empty();

  const wsIsReady = () => wsRef.current?.isReady || false;

  const wsIsPlaying = () => playingRef.current;

  const wsTogglePlay = () => {
    setPlaying(!playingRef.current);
    return playingRef.current;
  };
  const wsNextRegion = () => {
    if (currentRegionRef.current) {
      console.log(currentRegionRef.current);
    }
  };
  const wsSplitRegion = () => {
    console.log(progressRef.current);
    console.log(currentRegionRef.current.start, currentRegionRef.current.end);

    if (currentRegionRef.current) {
      var region = {
        start: progressRef.current,
        end: currentRegionRef.current.end,
        color: randomColor(0.1),
      };
      currentRegionRef.current.end = progressRef.current;
      wsRef.current?.addRegion(region);
      console.log(currentRegionRef.current.start, currentRegionRef.current.end);
    }
  };
  const wsPlay = () => setPlaying(true);

  const wsPause = () => setPlaying(false);

  const wsDuration = () =>
    durationRef.current || wsRef.current?.getDuration() || 0;

  const wsPosition = () => progressRef.current;

  const wsGoto = (position: number) => {
    if (position && durationRef.current)
      position = position / durationRef.current;
    keepRegion.current = true;
    wsRef.current?.seekAndCenter(position);
    if (singleRegionRef.current) keepRegion.current = false;
  };
  const wsSetPlaybackRate = (rate: number) =>
    wsRef.current?.setPlaybackRate(rate);

  const wsZoom = (zoom: number) => {
    wsRef.current?.zoom(zoom);
    console.log('zoom', zoom, wsRef.current?.params.minPxPerSec);
    return wsRef.current?.params.minPxPerSec;
  };

  const wsLoad = (
    blob: Blob,
    mimeType: string = blob.type,
    regions: string = '',
    autoSegment: boolean = false
  ) => {
    durationRef.current = 0;
    if (regions) inputRegionsRef.current = JSON.parse(regions);
    autoSegRef.current = autoSegment;
    if (!wsRef.current) blobToLoad.current = blob;
    else wsRef.current?.loadBlob(blob);
    blobTypeRef.current = mimeType;
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

  const wsHasRegion = () => currentRegionRef.current !== undefined;

  const wsLoopRegion = (loop: boolean) => {
    if (!currentRegionRef.current) return false;
    currentRegionRef.current.loop = loop;
    if (currentRegionRef.current.loop) wsGoto(currentRegionRef.current.start);
    return currentRegionRef.current.loop;
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
    durationRef.current = wavesurfer.getDuration();
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
      if (!wsRef.current?.backend) return; //closed while we were working on the blob
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
  //delete the audio in the current region
  const wsRegionDelete = () => {
    if (!currentRegionRef.current || !wsRef.current) return;
    var wavesurfer = wsRef.current;
    var start = trimTo(currentRegionRef.current.start, 3);
    var end = trimTo(currentRegionRef.current.end, 3);
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
    durationRef.current = wavesurfer.getDuration();
    return emptySegment;
  };
  const getPeaks = () => {
    if (!peaksRef.current && wsRef.current)
      peaksRef.current = wsRef.current.backend.getPeaks(512);
    return peaksRef.current;
  };
  function loadRegions(regions: any[]) {
    regions.forEach(function (region) {
      region.color = randomColor(0.1);
      wsRef.current?.addRegion(region);
    });
  }
  function wsAutoSegment() {
    var regions = extractRegions();
    loadRegions(regions);
    if (regions.length) wsGoto(regions[0].start);
  }
  function wsGetRegions() {
    var wavesurfer = wsRef.current;
    if (!wavesurfer) return '';
    return JSON.stringify(
      Object.keys(wavesurfer?.regions.list).map(function (id) {
        let region = wavesurfer?.regions.list[id];
        return {
          start: region.start,
          end: region.end,
          attributes: region.attributes,
          data: region.data,
        };
      })
    );
  }

  const extractRegions = () => {
    // Silence params
    const minValue = 0.0025;
    const minSeconds = 0.1;
    const peaks = getPeaks();
    if (!peaks) return [];

    var length = peaks.length;
    var coef = durationRef.current / length;
    var minLen = minSeconds / coef;

    // Gather silence indeces
    var silences: number[] = [];
    Array.prototype.forEach.call(peaks, function (val, index) {
      if (val < minValue) {
        silences.push(index);
      }
    });

    // Cluster silence values
    var clusters: number[][] = [];
    silences.forEach(function (val, index) {
      if (clusters.length && val === silences[index - 1] + 1) {
        clusters[clusters.length - 1].push(val);
      } else {
        clusters.push([val]);
      }
    });

    // Filter silence clusters by minimum length
    var fClusters = clusters.filter(function (cluster) {
      return cluster.length >= minLen;
    });

    // Create regions on the edges of silences
    var regions = fClusters.map(function (cluster, index) {
      var next = fClusters[index + 1];
      return {
        start: cluster[cluster.length - 1],
        end: next ? next[0] : length - 1,
      };
    });
    // Add an initial region if the audio doesn't start with silence
    var firstCluster = fClusters[0];
    if (firstCluster && firstCluster[0] !== 0) {
      regions.unshift({
        start: 0,
        end: firstCluster[firstCluster.length - 1],
      });
    }

    // Filter regions by minimum length
    var fRegions = regions.filter(function (reg) {
      return reg.end - reg.start >= minLen;
    });

    // Return time-based regions
    var tRegions = fRegions.map(function (reg) {
      return {
        start: Math.round(reg.start * coef * 10) / 10,
        end: Math.round(reg.end * coef * 10) / 10,
      };
    });
    // Combine the regions so the silence is included at the end of the region
    return tRegions.map(function (reg, index) {
      var next = tRegions[index + 1];
      return {
        start: reg.start,
        end: next ? next.start : reg.end,
      };
    });
  };

  /**
   * Random RGBA color.
   */
  function randomColor(seed: number) {
    return (
      'rgba(' +
      [
        ~~(Math.random() * 255),
        ~~(Math.random() * 255),
        ~~(Math.random() * 255),
        seed || 1,
      ] +
      ')'
    );
  }
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
    wsHasRegion,
    wsLoopRegion,
    wsRegionDelete,
    wsInsertAudio,
    wsInsertSilence,
    wsZoom,
    wsGetRegions,
    wsAutoSegment,
    wsNextRegion,
    wsSplitRegion,
  };
}
