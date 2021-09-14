import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { waitForIt } from '../utils';

export interface IRegionChange {
  start: number;
  end: number;
  newStart: number;
  newEnd: number;
}
export interface IRegionParams {
  silenceThreshold: number;
  timeThreshold: number;
  segLenThreshold: number;
}
export interface IRegions {
  params: IRegionParams;
  regions: { start: number; end: number }[];
}
export function useWaveSurferRegions(
  singleRegionOnly: boolean,
  onRegion: (
    count: number,
    params: IRegionParams | undefined,
    newRegion: boolean
  ) => void,
  onPlayStatus: (playing: boolean) => void,
  duration: () => number,
  isNear: (test: number) => boolean,
  goto: (position: number) => void,
  progress: () => number,
  setPlaying: (playing: boolean) => void
) {
  const [ws, setWaveSurfer] = useState<WaveSurfer>();
  const wavesurferRef = useRef<WaveSurfer>();
  const singleRegionRef = useRef(singleRegionOnly);
  const currentRegionRef = useRef<any>();
  const loopingRegionRef = useRef<any>();
  const updatingRef = useRef(false);
  const resizingRef = useRef(false);
  const loadingRef = useRef(false);
  const playRegionRef = useRef(false);
  const paramsRef = useRef<IRegionParams>();
  const peaksRef = useRef<
    ReadonlyArray<number> | ReadonlyArray<ReadonlyArray<number>>
  >();
  const regionIds = () => Object.keys(wavesurferRef.current?.regions.list);
  const region = (id: string) => wavesurferRef.current?.regions.list[id];
  const numRegions = () => regionIds().length;

  const currentRegion = () =>
    singleRegionRef.current
      ? numRegions() > 0
        ? region(regionIds()[0])
        : undefined
      : currentRegionRef.current;
  const setCurrentRegion = (r: any) => (currentRegionRef.current = r);

  const findNextRegion = (r: any, selfIfAtStart: boolean) => {
    if (!r) return undefined;
    if (selfIfAtStart && (numRegions() === 1 || isNear(r.start))) return r;
    return r.attributes.nextRegion;
  };

  useEffect(() => {
    wavesurferRef.current = ws;
    if (ws) {
      ws.on('region-created', function (r: any) {
        //console.log('region-created', loadingRef.current);
        if (singleRegionRef.current) {
          r.drag = true;
          if (currentRegion()) currentRegion().remove();
        } else {
          r.drag = false;
        }
        setCurrentRegion(r);
        if (!loadingRef.current) {
          //we could wait for this to show up, but we aren't actually using
          //the number of regions so we don't need it to be accurate...just more than 0
          onRegion(numRegions() + 1, paramsRef.current, true);
        }
      });
      ws.on('region-removed', function (r: any) {
        if (r.attributes?.prevRegion)
          r.attributes.prevRegion.attributes.nextRegion =
            r.attributes?.nextRegion;
        if (r.attributes.nextRegion)
          r.attributes.nextRegion.attributes.prevRegion =
            r.attributes.prevRegion;
        if (!loadingRef.current) {
          //wait for it to be removed from this list
          waitForIt(
            'region removed',
            () => region(r.id) === undefined,
            () => false,
            200
          ).then(() => {
            onRegion(numRegions(), paramsRef.current, true);
          });
        }
      });
      ws.on('region-updated', function (r: any) {
        resizingRef.current = r.isResizing;
      });
      ws.on('region-update-end', function (r: any) {
        if (singleRegionRef.current) {
          goto(r.start);
        } else if (!updatingRef.current && resizingRef.current) {
          resizingRef.current = false;
          var next = findNextRegion(r, false);
          var prev = findPrevRegion(r);
          if (prev) {
            if (prev.end !== r.start) {
              updateRegion(prev, { end: r.start });
              goto(r.start);
            }
          } else if (r.start !== 0) {
            updateRegion(r, { start: 0 });
            goto(0);
          }
          if (next) {
            if (next.start !== r.end) {
              updateRegion(next, { start: r.end });
              goto(r.end);
            }
          } else if (r.end !== duration()) {
            updateRegion(r, { end: duration() });
            goto(duration());
          }
          onRegion(
            Object.keys(ws.regions.list).length,
            paramsRef.current,
            true
          );
        }
      });
      /* other potentially useful messages
      ws.on('region-play', function (r: any) {
        console.log('region-play', r.start, r.loop);
      });*/
      ws.on('region-in', function (r: any) {
        //console.log('region-in', r.start, r.loop);
        setCurrentRegion(r);
      });
      ws.on('region-out', function (r: any) {
        //console.log('region-out', r.start, r.loop, playRegionRef.current);
        //help it in case it forgot -- unless the user clicked out
        //here is where we could add a pause possibly
        if (r.loop && r === loopingRegionRef.current) goto(r.start);
        if (playRegionRef.current && !r.loop) {
          onPlayStatus(false);
        }
      });
      ws.on('region-click', function (r: any) {
        setCurrentRegion(r);
        loopingRegionRef.current = r;
      });
      ws.on('region-dblclick', function (r: any) {
        if (!singleRegionOnly) {
          wsAddOrRemoveRegion();
        }
      });
      ws.drawer.on('dblclick', (event: any, progress: number) => {
        if (!singleRegionOnly) {
          wsAddOrRemoveRegion();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws]);

  const isInRegion = (r: any, value: number) => {
    return value <= r.end && value >= r.start;
  };

  const findRegion = (value: number) => {
    if (currentRegion() && isInRegion(currentRegion(), value))
      return currentRegion();
    var foundIt: any = undefined;
    regionIds().forEach(function (id) {
      let r = region(id);
      if (r.start <= value && r.end >= value) {
        foundIt = r;
      }
    });
    return foundIt;
  };
  const updateRegion = (r: any, params: any) => {
    updatingRef.current = true;
    r.update(params);
    updatingRef.current = false;
  };

  const getPeaks = (num: number = 512) => {
    if (!peaksRef.current && wavesurferRef.current)
      peaksRef.current = wavesurferRef.current.backend.getPeaks(num);
    return peaksRef.current;
  };

  const extractRegions = (params: IRegionParams) => {
    // Silence params
    const minValue = params.silenceThreshold || 0.002;
    const minSeconds = params.timeThreshold || 0.05;
    const minRegionLenSeconds = params.segLenThreshold || 0.5;

    var numPeaks = Math.floor(duration() / minSeconds);
    numPeaks = Math.min(Math.max(numPeaks, 512), 512 * 16);
    var peaks = getPeaks(numPeaks);
    if (!peaks) return [];

    var length = peaks.length;
    var coef = duration() / length;
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
        end: next ? next.start : duration(),
      };
    });
  };

  const setPrevNext = (sortedIds: string[]) => {
    if (!wavesurferRef.current || sortedIds.length === 0) return;
    var prev: any = undefined;
    sortedIds.forEach(function (id) {
      let r = region(id);
      if (prev) {
        prev.attributes.nextRegion = r;
        r.attributes.prevRegion = prev;
      }
      prev = r;
    });
  };
  function clearRegions() {
    if (!wavesurferRef.current) return;
    loadingRef.current = true;
    wavesurferRef.current.regions.clear();
    currentRegionRef.current = undefined;
    loopingRegionRef.current = undefined;
    loadingRef.current = false;
  }
  function loadRegions(
    regions: IRegions | undefined,
    loop: boolean,
    newRegions: boolean = false
  ) {
    if (!newRegions) peaksRef.current = undefined; //because I know this is a new wave
    if (!wavesurferRef.current) return;
    loadingRef.current = true;
    paramsRef.current = regions?.params;
    wavesurferRef.current.regions.clear();
    if (!regions || regions.regions.length === 0) {
      singleRegionRef.current = true;
      loadingRef.current = false;
      return;
    }
    singleRegionRef.current = regions.regions.length === 1;
    var regarray = Array.isArray(regions.regions)
      ? regions.regions
      : JSON.parse(regions.regions);
    regarray.forEach(function (region: any) {
      region.color = randomColor(0.1);
      region.drag = false;
      region.loop = loop;
      wavesurferRef.current?.addRegion(region);
    });
    waitForIt(
      'wait for last region',
      () => numRegions() === regarray.length,
      () => false,
      400
    ).then(() => {
      setPrevNext(regionIds());
      onRegion(regarray.length, paramsRef.current, newRegions);
      loadingRef.current = false;
    });
  }

  const findPrevRegion = (r: any) => {
    if (!r) return undefined;
    return r.attributes.prevRegion;
  };

  const wsSplitRegion = (r: any, split: number) => {
    var ret: IRegionChange = {
      start: r ? r.start : 0,
      end: r ? r.end : duration(),
      newStart: r ? r.start : 0,
      newEnd: split,
    };
    if (!wavesurferRef.current) return ret;
    singleRegionRef.current = false;
    var region = {
      start: split,
      end: ret.end,
      drag: false,
      color: randomColor(0.1),
      loop: r ? r.loop : false,
    };
    var newRegion = wavesurferRef.current.addRegion(region);
    var newSorted: string[] = [];
    if (r) {
      var sortedIds: string[] = getSortedIds();
      var curIndex = sortedIds.findIndex((s) => s === r.id);
      updateRegion(r, { end: split });
      newSorted = sortedIds
        .slice(0, curIndex + 1)
        .concat(newRegion.id)
        .concat(sortedIds.slice(curIndex + 1));
    } else {
      region = {
        start: 0,
        end: split,
        drag: false,
        color: randomColor(0.1),
        loop: false,
      };
      var firstRegion = wavesurferRef.current.addRegion(region);
      newSorted.push(firstRegion.id);
      newSorted.push(newRegion.id);
    }
    setPrevNext(newSorted);
    if (r && r.loop && ret.newEnd < ret.end)
      //&& playing
      goto(ret.start + 0.01);
    return ret;
  };

  const wsRemoveSplitRegion = (forceNext?: boolean) => {
    var r = currentRegion();
    if (!r) return undefined;

    var ret: IRegionChange = {
      start: r.start,
      end: r.end,
      newStart: r.start,
      newEnd: r.end,
    };
    if (forceNext !== true) {
      var prev = findPrevRegion(r);
      if (isNear(r.start) && prev) {
        updateRegion(r, { start: prev.start });
        ret.newStart = prev.start;
        prev.remove();
        return;
      }
    }
    //find next region
    var next = findNextRegion(r, false);
    if (next) {
      updateRegion(r, { end: next.end });
      ret.newEnd = next.end;
      next.remove();
    } else if (numRegions() === 1) {
      r.remove();
      singleRegionRef.current = true;
    }
    return ret;
  };

  const getSortedIds = () => {
    var sortedIds: string[] = [];
    if (!wavesurferRef.current) return sortedIds;

    var ids = Object.keys(wavesurferRef.current.regions?.list).map((id) => id);
    if (ids.length > 0) {
      var next: string | undefined = ids[0];
      while (next) {
        var r: any = wavesurferRef.current.regions.list[next];
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
    if (
      currentRegion() &&
      (isNear(currentRegion().start) || isNear(currentRegion().end))
    )
      return wsRemoveSplitRegion(false);
    else return wsSplitRegion(currentRegion(), progress());
  };

  function wsAutoSegment(loop: boolean = false, params: IRegionParams) {
    if (!wavesurferRef.current) return;
    var regions = extractRegions(params);
    paramsRef.current = params;
    loadRegions({ params: params, regions: regions }, loop, true);
    if (regions.length) goto(regions[0].start);
    return regions.length;
  }
  const wsPrevRegion = () => {
    var r = findPrevRegion(currentRegion());
    var newPlay = true;
    if (r) {
      goto(r.start);
      loopingRegionRef.current = r;
    } else {
      goto(0);
      newPlay = false;
    }
    setPlaying(newPlay);
    return newPlay;
  };
  const wsNextRegion = () => {
    //TT-2825 changing selfIfAtStart to false
    //but I coded that in there for this call, so
    //wonder what case I was handling then????
    var r = findNextRegion(currentRegion(), false);
    var newPlay = true;
    if (r) {
      goto(r.start);
      loopingRegionRef.current = r;
    } else {
      goto(duration());
      newPlay = false;
    }
    setPlaying(newPlay);
    return newPlay;
  };

  const wsGetRegions = () => {
    if (!wavesurferRef.current) return '[]';
    var regions = JSON.stringify(
      Object.keys(wavesurferRef.current.regions.list).map(function (id) {
        let r = region(id);
        return {
          start: r.start,
          end: r.end,
        };
      })
    );
    return JSON.stringify({ params: paramsRef.current, regions: regions });
  };

  const wsLoopRegion = (loop: boolean) => {
    regionIds().forEach(function (id) {
      let r = region(id);
      r.loop = loop;
    });
    return loop;
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

  function justPlayRegion(progress: number) {
    if (
      singleRegionRef.current &&
      currentRegion() &&
      !currentRegion().loop &&
      currentRegion().start <= progress &&
      currentRegion().end > progress + 0.01
    ) {
      playRegionRef.current = true;
      currentRegion().play(progress);
      return true;
    }
    playRegionRef.current = false;
    return false;
  }
  function onRegionProgress(progress: number) {
    /*
    if (currentRegion() && singleRegionRef.current) {
      if (
        progress >= currentRegion().end - 0.01 ||
        progress <= currentRegion().start
      ) {
        if (wavesurferRef.current?.isPlaying()) {
          setPlaying(false);
        }
      }
    } */
  }
  function onRegionSeek(e: number, keepRegion: boolean) {
    if (singleRegionRef.current && !keepRegion && currentRegion()) {
      currentRegion().remove();
      setCurrentRegion(undefined);
    }
  }
  function onRegionGoTo(position: number) {
    setCurrentRegion(findRegion(position));
  }
  return {
    wsAutoSegment,
    wsSplitRegion,
    wsRemoveSplitRegion,
    wsAddOrRemoveRegion,
    wsPrevRegion,
    wsNextRegion,
    wsGetRegions,
    wsLoopRegion,
    clearRegions,
    loadRegions,
    justPlayRegion,
    onRegionSeek,
    onRegionProgress,
    onRegionGoTo,
    currentRegion,
    setWaveSurfer,
  };
}
