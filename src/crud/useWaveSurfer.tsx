import _ from 'lodash';
import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { createWaveSurfer } from '../components/WSAudioPlugins';
//import { useMounted } from '../utils';
//import { convertToMP3 } from '../utils/mp3';
import { convertToWav } from '../utils/wav';

const noop = () => {};
const noop1 = (x: any) => {};

export function useWaveSurfer(
  container: any,
  onReady: () => void = noop,
  onProgress: (progress: number) => void = noop1,
  onRegion: (count: number) => void = noop1,
  onStop: () => void = noop,
  onError: (e: any) => void = noop,
  height: number = 128,
  singleRegion: boolean = false,
  timelineContainer?: any
) {
  //const isMounted = useMounted('wavesurfer');
  const progressRef = useRef(0);
  const wavesurferRef = useRef<WaveSurfer>();
  const blobToLoad = useRef<Blob>();
  const blobTypeRef = useRef('');
  const playingRef = useRef(false);
  const currentRegionRef = useRef<any>();
  const regionPlayingRef = useRef(false);
  const keepRegion = useRef(false);
  const durationRef = useRef(0);
  const peaksRef = useRef<
    ReadonlyArray<number> | ReadonlyArray<ReadonlyArray<number>>
  >();
  const inputRegionsRef = useRef<{ start: number; end: number }[]>();
  const autoSegRef = useRef(false);
  const updatingRef = useRef(false);
  const resizingRef = useRef(false);
  const progress = () => progressRef.current;
  const isNear = (position: number) => {
    console.log('isNear', position, progressRef.current);
    return Math.abs(position - progressRef.current) < 0.3;
  };
  const regionIsPlaying = () => regionPlayingRef.current;
  const setRegionIsPlaying = (val: boolean) => (regionPlayingRef.current = val);
  const currentRegion = () => currentRegionRef.current;
  const setCurrentRegion = (r: any) => (currentRegionRef.current = r);
  const updateRegion = (r: any, params: any) => {
    updatingRef.current = true;
    console.log('update', r, params);
    r.update(params);
    updatingRef.current = false;
  };
  const wavesurfer = () => wavesurferRef.current;

  useEffect(() => {
    function create(container: any, height: number, singleRegion: boolean) {
      var ws = createWaveSurfer(container, height, timelineContainer);
      wavesurferRef.current = ws;
      //setSingleRegion(singleRegion);
      ws.on('ready', function () {
        durationRef.current = ws.getDuration();
        if (inputRegionsRef.current) {
          loadRegions(inputRegionsRef.current);
        } else if (autoSegRef.current) wsAutoSegment();
        if (playingRef.current) setPlaying(true);
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
        console.log('seek', e, e * wsDuration(), keepRegion.current);
        if (!keepRegion.current && currentRegion()) {
          currentRegion().remove();
          setCurrentRegion(undefined);
          console.log('removing my region');
          if (onRegion) onRegion(0);
        }
        setProgress(e * wsDuration());
      });
      ws.on('finish', function () {
        console.log('finish');
        setPlaying(false);
        onStop();
      });
      ws.on('region-created', function (r: any) {
        console.log('region-created');
        if (singleRegion) {
          r.drag = true;
          if (currentRegion()) currentRegion().remove();
        } else {
          r.drag = false;
        }
        setCurrentRegion(r);
        if (onRegion)
          onRegion(Object.keys(wavesurfer()?.regions.list).length + 1);
      });
      ws.on('region-removed', function (r: any) {
        console.log('remove', r.start, r.end);
        if (r.attributes?.prevRegion)
          r.attributes.prevRegion.attributes.nextRegion =
            r.attributes?.nextRegion;
        if (r.attributes.nextRegion)
          r.attributes.nextRegion.attributes.prevRegion =
            r.attributes.prevRegion;
        if (onRegion) onRegion(Object.keys(wavesurfer()?.regions.list).length);
      });
      ws.on('region-updated', function (r: any) {
        resizingRef.current = r.isResizing;
      });
      ws.on('region-update-end', function (r: any) {
        console.log(
          'region-update-end',
          r.start,
          r.end,
          updatingRef.current,
          resizingRef.current
        );
        wavesurfer()?.zoom(wavesurfer()?.params.minPxPerSec);
        console.log(singleRegion);
        if (singleRegion) {
          wsGoto(currentRegion().start);
          keepRegion.current = false;
        } else if (!updatingRef.current && resizingRef.current) {
          resizingRef.current = false;
          var next = findNextRegion(r, false);
          console.log('next', next?.start);
          var prev = findPrevRegion(r);
          console.log('prev', prev?.end);
          if (prev) {
            if (prev.end !== r.start) {
              updateRegion(prev, { end: r.start });
              wsGoto(r.start);
            }
          } else if (r.start !== 0) {
            updateRegion(r, { start: 0 });
            wsGoto(0);
          }
          if (next) {
            if (next.start !== r.end) {
              updateRegion(next, { start: r.end });
              wsGoto(r.end);
            }
          } else if (r.end !== durationRef.current) {
            updateRegion(r, { end: durationRef.current });
            wsGoto(durationRef.current);
          }
          console.log(prev?.end, next?.start);
          if (onRegion)
            onRegion(Object.keys(wavesurfer()?.regions.list).length);
        }
      });
      /* other potentially useful messages
      ws.on('loading', function (progress) {
        console.log('loading', progress);
      });
      ws.on('region-play', function (r: any) {
        console.log('region-play', r.start, r.loop);
      });*/
      ws.on('region-in', function (r: any) {
        console.log('region-in', r.start, r.loop);
        setCurrentRegion(r);
      });
      ws.on('region-out', function (r: any) {
        console.log('region-out', r.start, r.loop);
      });
      ws.on('region-click', function (r: any) {
        console.log('region-click', r, currentRegion());
        keepRegion.current = true;
        setCurrentRegion(r);
      });
      ws.on('region-dblclick', function (r: any) {
        console.log('region-dblclick', r);
        setCurrentRegion(r);
        console.log(progress(), r.start, r.end);
        if (!singleRegion) {
          wsAddOrRemoveRegion();
        }
      });

      return ws;
    }

    if (container && !wavesurfer()) {
      console.log('creating a wavesurfer');
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
      console.log('cleanup wavesurfer', wavesurferRef.current);

      if (wavesurferRef.current) {
        console.log('cleanup wavesurfer');
        if (wavesurferRef.current.isPlaying()) wavesurferRef.current.stop();
        wavesurferRef.current.unAll();
        wavesurferRef.current.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isInRegion = (r: any, value: number) => {
    return value <= r.end && value >= r.start;
  };

  const findRegion = (value: number) => {
    if (currentRegion() && isInRegion(currentRegion(), value))
      return currentRegion();
    var foundIt: any = undefined;
    Object.keys(wavesurfer()?.regions.list).forEach(function (id) {
      let r = wavesurfer()?.regions.list[id];
      if (r.start <= value && r.end >= value) {
        foundIt = r;
      }
    });
    return foundIt;
  };
  const findNextRegion = (r: any, selfIfAtStart: boolean) => {
    if (!r) return undefined;
    if (selfIfAtStart && isNear(r.start)) return r;
    console.log('nextRegion', r.attributes.nextRegion?.start);
    return r.attributes.nextRegion;
    /*
    var foundIt: any = undefined;
    Object.keys(wavesurfer()?.regions.list).forEach(function (id) {
      let r = wavesurfer()?.regions.list[id];
      if (r.start >= currentRegion().end) {
        if (foundIt && foundIt.end > r.end) foundIt = r;
        if (!foundIt) foundIt = r;
      }
    });

    return foundIt; */
  };
  const findPrevRegion = (r: any) => {
    if (!r) return undefined;
    return r.attributes.prevRegion;
    /*
    var foundIt: any = undefined;
    Object.keys(wavesurfer()?.regions.list).forEach(function (id) {
      let r = wavesurfer()?.regions.list[id];
      if (r.end <= currentRegion().start) {
        if (foundIt && foundIt.start < r.start) foundIt = r;
        if (!foundIt) foundIt = r;
      }
    });
    return foundIt; */
  };
  const setProgress = (value: number) => {
    progressRef.current = value;
    onProgress(value);
    if (currentRegion()) {
      if (
        value >= currentRegion().end - 0.01 ||
        value <= currentRegion().start
      ) {
        if (regionIsPlaying()) {
          //turning off region play
          setRegionIsPlaying(false);
          if (singleRegion) {
            setPlaying(false);
            onStop();
          }
        }
      }
    }
  };

  const setPlaying = (value: boolean) => {
    playingRef.current = value;
    if (value) {
      if (wavesurfer()?.isReady) {
        if (
          singleRegion &&
          currentRegion() &&
          !currentRegion().loop &&
          currentRegion().start <= progress() &&
          currentRegion().end > progress() + 0.01
        ) {
          //play region once
          setRegionIsPlaying(true);
          currentRegion().play(progress());
        } else {
          //default play (which will loop region if looping is on)
          wavesurfer()?.play(progress());
        }
      }
    } else if (wavesurfer()?.isPlaying()) wavesurfer()?.pause();
  };
  const wsClear = () => wavesurfer()?.empty();

  const wsIsReady = () => wavesurfer()?.isReady || false;

  const wsIsPlaying = () => playingRef.current;

  const wsTogglePlay = () => {
    setPlaying(!playingRef.current);
    return playingRef.current;
  };
  const wsNextRegion = () => {
    if (currentRegion()) {
      var r = findNextRegion(currentRegion(), true);
      if (r) {
        wsGoto(r.start);
        setPlaying(true);
      } else wsGoto(durationRef.current);
    }
  };
  const saveRegions = () => {
    return JSON.stringify(
      Object.keys(wavesurfer()?.regions.list).map(function (id) {
        let region = wavesurfer()?.regions.list[id];
        /*
        let attributes = { ...region.attributes };
        var next = attributes.nextRegion;
        var prev = attributes.prevRegion;
        if (next) attributes.nextRegion = { s: next.start, e: next.end };
        if (prev) attributes.prevRegion = { s: prev.start, e: prev.end };
        */
        return {
          start: region.start,
          end: region.end,
        };
      })
    );
  };
  const getSortedIds = () => {
    var sortedIds: string[] = [];
    console.log(wavesurfer()?.regions);
    var ids = Object.keys(wavesurfer()?.regions?.list).map((id) => id);
    if (ids.length > 0) {
      var next: string | undefined = ids[0];
      while (next) {
        var r: any = wavesurfer()?.regions.list[next];
        if (r) {
          sortedIds.push(next);
          if (r.attributes.nextRegion) next = r.attributes.nextRegion.id;
          else next = undefined;
        } else next = undefined;
      }
    }
    return sortedIds;
  };
  const wsAddOrRemoveRegion = () => {
    console.log('add or remove');
    if (isNear(currentRegion().start) || isNear(currentRegion().end))
      wsRemoveSplitRegion(false);
    else wsSplitRegion();
  };
  const wsSplitRegion = () => {
    var sortedIds: string[] = getSortedIds();
    if (currentRegion()) {
      var split = progress();
      var lastRegion = currentRegion().attributes.nextRegion === undefined;
      var region = {
        start: split,
        end: currentRegion().end,
        drag: false,
        color: randomColor(0.1),
      };
      var curIndex = sortedIds.findIndex((s) => s === currentRegion().id);
      updateRegion(currentRegion(), { end: split });
      var newRegion = wavesurfer()?.addRegion(region);
      var newSorted = sortedIds.slice(0, curIndex + 1).concat(newRegion.id);
      if (!lastRegion)
        newSorted = newSorted.concat(sortedIds.slice(curIndex + 1));
      setPrevNext(newSorted);
    }
  };
  const wsRemoveSplitRegion = (forceNext?: boolean) => {
    console.log('removesplit', progress(), forceNext);
    console.log(currentRegion().start, currentRegion().end);
    if (currentRegion()) {
      var r = currentRegion();
      if (forceNext !== true) {
        var prev = findPrevRegion(r);
        console.log('do I have prev?', prev);
        if (isNear(r.start) && prev) {
          console.log('remove prev');
          updateRegion(r, { start: prev.start });
          prev.remove();
          return;
        }
      }
      console.log('remove next');
      //find next region
      var next = findNextRegion(r, false);
      if (next) {
        updateRegion(r, { end: next.end });
        next.remove();
      }
    }
  };
  const wsPlay = () => setPlaying(true);

  const wsPause = () => setPlaying(false);

  const wsDuration = () =>
    durationRef.current || wavesurfer()?.getDuration() || 0;

  const wsPosition = () => progressRef.current;

  const wsGoto = (position: number) => {
    setCurrentRegion(findRegion(position));
    console.log('wsGoTo', position, currentRegion());
    if (position && wsDuration()) position = position / wsDuration();
    keepRegion.current = true;
    console.log('seekAndCenter', position);
    wavesurfer()?.seekAndCenter(position);
    if (singleRegion) keepRegion.current = false;
  };
  const wsSetPlaybackRate = (rate: number) =>
    wavesurfer()?.setPlaybackRate(rate);

  const wsZoom = (zoom: number) => {
    wavesurfer()?.zoom(zoom);
    console.log('zoom', zoom, wavesurfer()?.params.minPxPerSec);
    return wavesurfer()?.params.minPxPerSec;
  };

  const wsLoad = (
    blob: Blob,
    mimeType: string = blob.type,
    regions: string = '',
    autoSegment: boolean = false
  ) => {
    console.log('load playing?', wavesurfer()?.isPlaying());
    durationRef.current = 0;
    if (regions) inputRegionsRef.current = JSON.parse(regions);
    autoSegRef.current = autoSegment;
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

  const wsHasRegion = () => currentRegionRef.current !== undefined;

  const wsLoopRegion = (loop: boolean) => {
    console.log('turn loop', loop);
    Object.keys(wavesurfer()?.regions.list).forEach(function (id) {
      let r = wavesurfer()?.regions.list[id];
      r.loop = loop;
    });
    return loop;
  };

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
    endposition?: number
  ) => {
    if (!wavesurfer()) return 0;
    var backend = wavesurfer()?.backend as any;
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
    durationRef.current = wavesurfer()?.getDuration() || 0;
    return (start_offset + newBuffer.length) / originalBuffer.sampleRate;
  };

  const wsInsertAudio = async (
    blob: Blob,
    position: number,
    overwriteToPosition?: number,
    mimeType?: string
  ) => {
    if (!wavesurfer()) return;
    var backend = wavesurfer()?.backend as any;
    if (!backend) return; //throw?
    var originalBuffer = backend.buffer;
    if (!originalBuffer) {
      wsLoad(blob, mimeType);
      return;
    }
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
    if (!currentRegionRef.current || !wavesurfer()) return;
    var start = trimTo(currentRegionRef.current.start, 3);
    var end = trimTo(currentRegionRef.current.end, 3);
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
    onRegion(0);
    var tmp = start - 0.03;
    if (tmp < 0) tmp = 0;
    wsGoto(tmp);
    durationRef.current = wavesurfer()?.getDuration() || 0;
    return emptySegment;
  };
  const getPeaks = (num: number = 512) => {
    if (!peaksRef.current && wavesurfer())
      peaksRef.current = wavesurfer()?.backend.getPeaks(num);
    return peaksRef.current;
  };
  function loadRegions(regions: any[]) {
    regions.forEach(function (region) {
      region.color = randomColor(0.1);
      region.drag = false;
      wavesurfer()?.addRegion(region);
    });
    setPrevNext(Object.keys(wavesurfer()?.regions.list).map((id) => id));
  }
  function wsAutoSegment(silenceThreshold?: number, timeThreshold?: number) {
    if (!wavesurfer()) return '';
    wavesurfer()?.regions.clear();
    var regions = extractRegions(silenceThreshold, timeThreshold);
    loadRegions(regions);
    if (regions.length) wsGoto(regions[0].start);
  }

  function wsGetRegions() {
    if (!wavesurfer()) return '';
    return saveRegions();
  }

  const setPrevNext = (sortedIds: string[]) => {
    var prev: any = undefined;
    sortedIds.forEach(function (id) {
      let r = wavesurfer()?.regions.list[id];
      console.log(r.start);
      if (prev) {
        prev.attributes.nextRegion = r;
        r.attributes.prevRegion = prev;
      }
      prev = r;
    });
  };
  const extractRegions = (
    silenceThreshold?: number,
    timeThreshold?: number
  ) => {
    // Silence params
    const minValue = silenceThreshold || 0.002;
    const minSeconds = timeThreshold || 0.05;
    const minRegionLenSeconds = 0.7;
    var numPeaks = Math.floor(wsDuration() / minSeconds);
    numPeaks = Math.min(Math.max(numPeaks, 512), 512 * 16);
    const peaks = getPeaks(numPeaks);
    if (!peaks) return [];

    var length = peaks.length;
    var coef = wsDuration() / length;
    var minLenSilence = Math.ceil(minSeconds / coef);
    var minLenRegion = Math.ceil(minRegionLenSeconds / coef);

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

    // Filter silence clusters by minimum length
    var fClusters = clusters.filter(function (cluster) {
      return cluster.length >= minLenSilence;
    });

    // Create regions on the edges of silences
    var regions = fClusters.map(function (cluster, index) {
      var next = fClusters[index + 1];
      return {
        start: cluster[cluster.length - 1] + 1,
        end: next ? next[0] - 1 : length - 1,
      };
    });

    // Filter regions by minimum length
    let fRegions = regions.filter(function (reg) {
      return reg.end - reg.start >= minLenRegion;
    });

    // Return time-based regions
    var tRegions = fRegions.map(function (reg) {
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
    if (tRegions.length > 0) {
      //add a region at zero if not there
      var firstRegion = tRegions[0];
      if (firstRegion.start !== 0) {
        tRegions.unshift({
          start: 0,
          end: firstRegion.start,
        });
      }
    }
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
    wsAddOrRemoveRegion,
    wsRemoveSplitRegion,
  };
}
