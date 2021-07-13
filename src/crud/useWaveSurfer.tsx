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
      ws.on('region-updated', function (r: any) {
        console.log(
          'region-updated',
          r.drag,
          r.resize,
          r.isDragging,
          r.start,
          r.end
        );
        currentRegionRef.current = r;
        if (r.drag) {
          var next = findNextRegion();
          if (next) next.start = r.end;
          var prev = findPrevRegion();
          if (prev) prev.end = r.start;
          console.log(prev?.end, next?.start);
        }
      });
      ws.on('region-update-end', function (r: any) {
        console.log('region-update-end', r.start, r.end);
        wsRef.current?.zoom(wsRef.current?.params.minPxPerSec);
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
        currentRegionRef.current = r;
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
    var foundIt: any = undefined;
    console.log('findRegion for', value);
    Object.keys(wsRef.current?.regions.list).forEach(function (id) {
      let r = wsRef.current?.regions.list[id];
      console.log(r.start, r.end, r.start <= value, r.end >= value);
      if (r.start <= value && r.end >= value) {
        console.log('foundIt', r.start, r.end);
        foundIt = r;
      }
    });
    console.log('findRegion', foundIt);
    return foundIt;
  };
  const findNextRegion = () => {
    return currentRegionRef.current.attributes.nextRegion;
    /*
    var foundIt: any = undefined;
    Object.keys(wsRef.current?.regions.list).forEach(function (id) {
      let r = wsRef.current?.regions.list[id];
      if (r.start >= currentRegionRef.current.end) {
        if (foundIt && foundIt.end > r.end) foundIt = r;
        if (!foundIt) foundIt = r;
      }
    });

    return foundIt; */
  };
  const findPrevRegion = () => {
    return currentRegionRef.current.attributes.prevRegion;
    /*
    var foundIt: any = undefined;
    Object.keys(wsRef.current?.regions.list).forEach(function (id) {
      let r = wsRef.current?.regions.list[id];
      if (r.end <= currentRegionRef.current.start) {
        if (foundIt && foundIt.start < r.start) foundIt = r;
        if (!foundIt) foundIt = r;
      }
    });
    return foundIt; */
  };
  const setProgress = (value: number) => {
    progressRef.current = value;
    onProgress(value);
    /*
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
      }
    } */
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
      var r = findNextRegion();
      if (r) r.playLoop();
    }
  };
  const saveRegions = () => {
    return JSON.stringify(
      Object.keys(wsRef.current?.regions.list).map(function (id) {
        let region = wsRef.current?.regions.list[id];
        let attributes = region.attributes;
        var next = attributes.nextRegion;
        var prev = attributes.prevRegion;
        if (next) attributes.nextRegion = { s: next.start, e: next.end };
        if (prev) attributes.prevRegion = { s: prev.start, e: prev.end };
        return {
          start: region.start,
          end: region.end,
          attributes: attributes,
          data: region.data,
        };
      })
    );
  };
  const getSortedIds = () => {
    var sortedIds: string[] = [];
    var ids = Object.keys(wsRef.current?.regions.list).map((id) => id);
    if (ids.length > 0) {
      var next: string | undefined = ids[0];
      while (next) {
        sortedIds.push(next);
        var r: any = wsRef.current?.regions.list[next];
        if (r.attributes.nextRegion) next = r.attributes.nextRegion.id;
        else next = undefined;
      }
    }
    return sortedIds;
  };
  const wsSplitRegion = () => {
    var sortedIds: string[] = getSortedIds();
    if (currentRegionRef.current) {
      var lastRegion =
        currentRegionRef.current.attributes.nextRegion === undefined;
      var region = {
        start: progressRef.current,
        end: currentRegionRef.current.end,
        color: randomColor(0.1),
      };
      var curIndex = sortedIds.findIndex(
        (s) => s === currentRegionRef.current.id
      );
      currentRegionRef.current.end = progressRef.current;
      var newRegion = wsRef.current?.addRegion(region);
      var newSorted = sortedIds.slice(0, curIndex + 1).concat(newRegion.id);
      if (!lastRegion)
        newSorted = newSorted.concat(sortedIds.slice(curIndex + 1));
      setPrevNext(newSorted);
      console.log(saveRegions());
    }
  };
  const wsRemoveSplitRegion = () => {
    console.log(progressRef.current);
    console.log(currentRegionRef.current.start, currentRegionRef.current.end);
    if (currentRegionRef.current) {
      if (
        currentRegionRef.current.end - progressRef.current <
        progressRef.current - currentRegionRef.current.start
      ) {
        //find next region
        var next = findNextRegion();
        if (next) {
          currentRegionRef.current.end = next.end;
          next.remove();
        }
      } else {
        var prev = findPrevRegion();
        if (prev) {
          currentRegionRef.current.start = prev.start;
          prev.remove();
        }
      }
    }
  };
  const wsPlay = () => setPlaying(true);

  const wsPause = () => setPlaying(false);

  const wsDuration = () =>
    durationRef.current || wsRef.current?.getDuration() || 0;

  const wsPosition = () => progressRef.current;

  const wsGoto = (position: number) => {
    currentRegionRef.current = findRegion(position);
    console.log('wsGoTo', position, currentRegionRef.current);
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
  const getPeaks = (num: number = 512) => {
    if (!peaksRef.current && wsRef.current)
      peaksRef.current = wsRef.current.backend.getPeaks(num);
    return peaksRef.current;
  };
  function loadRegions(regions: any[]) {
    regions.forEach(function (region) {
      region.color = randomColor(0.1);
      wsRef.current?.addRegion(region);
    });
  }
  function wsAutoSegment() {
    var wavesurfer = wsRef.current;
    if (!wavesurfer) return '';
    wavesurfer.regions.clear();
    var regions = extractRegions();
    loadRegions(regions);
    setPrevNext(Object.keys(wsRef.current?.regions.list).map((id) => id));
    if (regions.length) wsGoto(regions[0].start);
  }
  function wsGetRegions() {
    var wavesurfer = wsRef.current;
    if (!wavesurfer) return '';
    return saveRegions();
  }

  const setPrevNext = (sortedIds: string[]) => {
    var prev: any = undefined;
    sortedIds.forEach(function (id) {
      let r = wsRef.current?.regions.list[id];
      if (prev) {
        prev.attributes.nextRegion = r;
        r.attributes.prevRegion = prev;
      }
      prev = r;
    });
  };
  const extractRegions = () => {
    // Silence params
    const minValue = 0.0015;
    const minSeconds = 0.05;
    const numPeaks = Math.floor(durationRef.current / minSeconds);
    const peaks = getPeaks(512);
    if (!peaks) return [];

    var length = peaks.length;
    console.log('numPeaks', length);
    console.log('duration', durationRef.current);
    var coef = durationRef.current / length;
    console.log('coef', coef);
    var minLen = Math.ceil(minSeconds / coef);
    console.log('minLen', minLen);

    // Gather silence indeces
    var silences: number[] = [];
    Array.prototype.forEach.call(peaks, function (val, index) {
      if (Math.abs(val) < minValue) {
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
    console.log('before min len filter', clusters.length);
    // Filter silence clusters by minimum length
    var fClusters = clusters.filter(function (cluster) {
      return cluster.length >= minLen;
    });
    console.log('after min len filter', fClusters);

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
    //include the initial silence in the first region
    //regions[0].start = 0;

    // Return time-based regions
    var tRegions = regions.map(function (reg) {
      console.log({
        rstart: reg.start,
        start: Math.round(reg.start * coef * 10) / 10,
        rend: reg.end,
        end: Math.round(reg.end * coef * 10) / 10,
      });
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
    wsRemoveSplitRegion,
  };
}
