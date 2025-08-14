import { useEffect, useRef } from 'react';
import { waitForIt } from '../utils/waitForIt';
import RegionsPlugin, { Region } from 'wavesurfer.js/dist/plugins/regions';
import WaveSurfer from 'wavesurfer.js';

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
export interface IRegion {
  start: number;
  end: number;
  label?: string;
}
export interface IRegions {
  params: IRegionParams;
  regions: IRegion[];
}
export interface INamedRegion {
  name: string;
  regionInfo: IRegions;
}
export const parseRegionParams = (
  regionstr: string,
  defaultParams: IRegionParams | undefined
) => {
  if (!regionstr) return defaultParams;
  var segs = JSON.parse(regionstr);
  if (segs.params) {
    if (segs.params.timeThreshold) return segs.params;
  }
  return defaultParams;
};

export const parseRegions = (regionstr: string) => {
  if (!regionstr) return { params: {}, regions: [] as IRegion[] } as IRegions;
  var segs = JSON.parse(regionstr);
  if (segs.regions) {
    if (typeof segs.regions == 'string' || segs.regions instanceof String)
      segs.regions = JSON.parse(segs.regions);
  } else segs.regions = [];
  segs.regions.sort((a: IRegion, b: IRegion) => a.start - b.start);
  return segs as IRegions;
};
export function useWaveSurferRegions(
  singleRegionOnly: boolean,
  defaultRegionIndex: number,
  Regions: RegionsPlugin | undefined,
  ws: WaveSurfer | null,
  onRegion: (count: number, newRegion: boolean) => void,
  onPlayStatus: (playing: boolean) => void,
  duration: () => number,
  isNear: (test: number) => boolean,
  goto: (position: number) => void,
  progress: () => number,
  setPlaying: (playing: boolean) => void,
  onCurrentRegion?: (currentRegion: IRegion | undefined) => void,
  onStartRegion?: (start: number) => void,
  verses?: string
) {
  // const wavesurferRef = useRef<WaveSurfer | null>(null);
  const singleRegionRef = useRef(singleRegionOnly);
  const currentRegionRef = useRef<any>();
  const loopingRegionRef = useRef<any>();
  const loopingRef = useRef(false);
  const updatingRef = useRef(false);
  const resizingRef = useRef(false);
  const loadingRef = useRef(false);
  const playRegionRef = useRef(false);
  const paramsRef = useRef<IRegionParams>();
  const peaksRef = useRef<
    ReadonlyArray<number> | ReadonlyArray<ReadonlyArray<number>>
  >();
  const regions = () => Regions?.getRegions() ?? ([] as Region[]);
  const region = (id: string) => regions().find((x) => x.id === id);
  const numRegions = () => regions().length;
  const currentRegion = () => {
    return singleRegionRef.current
      ? numRegions() > 0
        ? regions()[0]
        : undefined
      : currentRegionRef.current;
  };
  const setCurrentRegion = (r: any) => {
    //console.log('setCurrentRegion', r?.start, currentRegionRef.current?.start);
    if (r !== currentRegionRef.current) {
      loopingRegionRef.current = r;
      currentRegionRef.current = r;
      onCurrentRegion &&
        onCurrentRegion(r ? { start: r.start, end: r.end } : undefined);
    }
  };

  const findNextRegion = (r: any, selfIfAtStart: boolean) => {
    if (!r) return undefined;
    if (selfIfAtStart && (numRegions() === 1 || isNear(r.start))) return r;
    return r.attributes?.nextRegion;
  };

  useEffect(() => {
    //wavesurferRef.current = ws;

    if (Regions) {
      Regions.on('region-created', function (r: any) {
        //console.log('region-created', singleRegionRef.current);
        if (singleRegionRef.current) {
          r.drag = true;
          if (currentRegion()) currentRegion().remove();
        } else {
          r.drag = false;
        }
        if (!loadingRef.current) {
          waitForIt(
            'region created',
            () => region(r.id) !== undefined,
            () => false,
            500
          )
            .then(() => {
              onRegion(numRegions(), true);
            })
            .catch((reason) => console.log(reason))
            .finally(() => {
              setCurrentRegion(findRegion(progress(), true));
            });
        }
      });
      Regions.on('region-removed', function (r: any) {
        if (r.attributes?.prevRegion)
          r.attributes.prevRegion.attributes.nextRegion =
            r.attributes?.nextRegion;
        if (r.attributes?.nextRegion)
          r.attributes.nextRegion.attributes.prevRegion =
            r.attributes?.prevRegion;
        if (!loadingRef.current) {
          // wait for it to be removed from this list
          waitForIt(
            'region removed',
            () => region(r.id) === undefined,
            () => false,
            200
          ).then(() => {
            onRegion(numRegions(), true);
            setCurrentRegion(findRegion(progress(), true));
          });
        }
      });
      //was region-updated
      Regions.on('region-update', function (r: any) {
        console.log('region-update', r);
        resizingRef.current = r.isResizing;
      });
      //was region-update-end
      Regions.on('region-updated', function (r: any) {
        console.log('region-updated', r);
        if (singleRegionRef.current) {
          if (!loadingRef.current) {
            waitForIt(
              'region update end',
              () => region(r.id) !== undefined,
              () => false,
              400
            ).then(() => {
              goto(r.start);
            });
          }
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
        }
        onRegion(numRegions(), true);
      });
      // other potentially useful messages
      // ws.on('region-play', function (r: any) {
      //   console.log('region-play', r.start, r.loop);
      // });
      Regions.on('region-in', function (r: any) {
        //TODO!! need to check for user interaction vs looping
        console.log('region-in', r.start);
        if (!loopingRef.current) setCurrentRegion(r);
      });
      Regions.on('region-out', function (r: Region) {
        console.log(
          'region-out',
          r.start,
          loopingRef.current,
          loopingRegionRef.current
        );
        //help it in case it forgot -- unless the user clicked out
        //here is where we could add a pause possibly
        if (loopingRef.current && r === loopingRegionRef.current) r.play();
        if (playRegionRef.current && !loopingRef.current) {
          onPlayStatus(false);
        }
      });
      Regions.on('region-clicked', function (r: any) {
        setCurrentRegion(r);
      });
      Regions.on('region-double-clicked', function (r: any) {
        console.log('region-double-clicked', r);
        if (!singleRegionOnly) {
          wsAddOrRemoveRegion();
        }
      });
      // TODO
      //ws.drawer.on('dblclick', (event: any, progress: number) => {
      //  if (!singleRegionOnly) {
      //    wsAddOrRemoveRegion();
      //  }
      //});
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws, Regions]);

  const isInRegion = (r: any, value: number) => {
    return value <= r.end && value >= r.start;
  };

  const findRegion = (value: number, force: boolean = false) => {
    if (!force && currentRegion() && isInRegion(currentRegion(), value))
      return currentRegion();
    var foundIt: any = undefined;
    regions().forEach(function (r) {
      if ((r?.start ?? 1000) <= value && (r?.end ?? 0) >= value) {
        foundIt = r;
      }
    });
    return foundIt;
  };
  const updateRegion = (r: Region, params: any) => {
    updatingRef.current = true;
    r.setOptions(params);
    updatingRef.current = false;
  };

  const getPeaks = (num: number = 512) => {
    if (!peaksRef.current && ws)
      peaksRef.current = ws.exportPeaks({ maxLength: num }); //TODO??what is this num??
    return peaksRef.current;
  };

  const mergeVerses = (autosegs: IRegion[]) => {
    if (!verses) return autosegs;
    const segs = parseRegions(verses)?.regions;
    if (!segs || !segs.length) return autosegs;
    let x = 0;
    var suggested: IRegion[] = [];
    var minLen = paramsRef.current?.segLenThreshold || 0.5;
    segs.forEach((s) => {
      let i = autosegs.findIndex((t: IRegion) => t.end > s.start);
      if (i < 0) {
        suggested.push(s);
      } else {
        suggested.push(...autosegs.slice(x, i));
        x = i;
        if (autosegs[i].start < s.start) {
          if (s.start - autosegs[i].start >= minLen) {
            suggested.push({ ...autosegs[i], end: s.start });
          } else {
            suggested[suggested.length - 1].end = s.start;
          }
        }
        if (autosegs[i].end - s.start >= minLen) {
          suggested.push({ ...s, end: autosegs[i].end });
        } else {
          x++; // skip the next one
          suggested.push({ ...s, end: autosegs[x]?.end ?? 0 });
        }
        x++;
      }
    });
    suggested.push(...autosegs.slice(x));
    return suggested;
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

    // Return time-based regions
    var tRegions = regions.map(function (reg) {
      return {
        start: Math.round(reg.start * coef * 1000) / 1000,
        end: Math.round(reg.end * coef * 1000) / 1000,
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
    let sRegions = tRegions.map(function (reg, index) {
      var next = tRegions[index + 1];
      return {
        start: reg.start,
        end: next ? next.start : duration(),
      };
    });
    var ix = 0;
    // combine regions shorter than minimum length
    while (ix < sRegions.length - 1) {
      if (sRegions[ix].end - sRegions[ix].start < minRegionLenSeconds) {
        sRegions[ix].end = sRegions[ix + 1].end;
        sRegions.splice(ix + 1, 1);
      } else {
        ix += 1;
      }
    }
    return sRegions;
  };
  const setAttribute = (r: any, attr: string, value: any) => {
    if (!(r as any).attributes) {
      (r as any).attributes = {};
    }
    (r as any).attributes[attr] = value;
  };
  const setPrevNext = (sortedIds: string[]) => {
    if (!ws || sortedIds.length === 0 || singleRegionRef.current) return;
    var prev: any = undefined;
    sortedIds.forEach(function (id) {
      let r = region(id);
      if (r && prev) {
        setAttribute(prev, 'nextRegion', r);
        setAttribute(r, 'prevRegion', prev);
      }
      prev = r;
    });
  };

  function clearRegions() {
    if (!ws || !numRegions() || loadingRef.current) return;
    loadingRef.current = true;
    Regions?.clearRegions();
    currentRegionRef.current = undefined;
    loopingRegionRef.current = undefined;
    loadingRef.current = false;
    onRegion(0, true);
  }
  function loadRegions(
    regions: IRegions | undefined,
    loop: boolean,
    newRegions: boolean = false
  ) {
    if (!newRegions) peaksRef.current = undefined; //because I know this is a new wave
    if (!ws) return false;
    loadingRef.current = true;
    paramsRef.current = regions?.params;

    if (!regions || !regions.regions || regions.regions.length === 0) {
      singleRegionRef.current = true;
      loadingRef.current = false;
      return true;
    }
    var regarray = (
      Array.isArray(regions.regions)
        ? regions.regions
        : JSON.parse(regions.regions)
    ).sort((a: any, b: any) => a.start - b.start);

    singleRegionRef.current = regarray.length === 1;
    regarray.forEach(function (region: any) {
      region.color = randomColor(0.1);
      region.drag = false;
      region.loop = loop;
      var r = Regions?.addRegion(region);
      region.id = r?.id;
    });
    waitForIt(
      'wait for last region',
      () => numRegions() === regarray.length,
      () => false,
      400
    ).finally(() => {
      setPrevNext(regarray.map((r: any) => r.id));
      onRegion(regarray.length, newRegions);
      if (defaultRegionIndex >= 0) {
        currentRegionRef.current = findRegion(
          regarray[defaultRegionIndex]?.start ?? 0
        );
      } else {
        onRegionGoTo(0);
      }
      loadingRef.current = false;
    });
    return true;
  }

  const findPrevRegion = (r: any) => {
    if (!r) return undefined;
    return r.attributes?.prevRegion;
  };

  const wsSplitRegion = (r: any, split: number) => {
    var ret: IRegionChange = {
      start: r ? r.start : 0,
      end: r ? r.end : duration(),
      newStart: r ? r.start : 0,
      newEnd: split,
    };
    if (!ws) return ret;
    singleRegionRef.current = false;
    var region = {
      start: split,
      end: ret.end,
      drag: false,
      color: randomColor(0.1),
      loop: r ? r.loop : false,
    };
    var newRegion = Regions?.addRegion(region);
    var newSorted: string[] = [];
    if (r) {
      var sortedIds: string[] = getSortedIds();
      var curIndex = sortedIds.findIndex((s) => s === r.id);
      updateRegion(r, { end: split });
      newSorted = sortedIds
        .slice(0, curIndex + 1)
        .concat(newRegion?.id ?? 'newid')
        .concat(sortedIds.slice(curIndex + 1));
    } else {
      region = {
        start: 0,
        end: split,
        drag: false,
        color: randomColor(0.1),
        loop: false,
      };
      var firstRegion = Regions?.addRegion(region);
      newSorted.push(firstRegion?.id ?? 'fr');
      newSorted.push(newRegion?.id ?? 'nr');
    }
    setPrevNext(newSorted);
    if (r && r.loop && ret.newEnd < ret.end)
      //&& playing
      goto(ret.start + 0.01);
    onRegion(numRegions(), true);
    return ret;
  };

  const wsRemoveSplitRegion = (forceNext?: boolean) => {
    var r = currentRegion();
    if (!r) return undefined;
    if (singleRegionRef.current) {
      clearRegions();
      return;
    }
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
        onRegion(numRegions(), true);
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
    onRegion(numRegions(), true);
    return ret;
  };

  const getSortedIds = () => {
    var sortedIds: string[] = [];
    if (!ws || numRegions() === 0) return sortedIds;
    //do I need to find start = 0?
    console.log('getSortedIds', regions());
    var next = regions()[0];
    while ((next as any).attributes?.prevRegion) {
      next = (next as any).attributes?.prevRegion;
    }
    while (next) {
      sortedIds.push(next.id);
      next = (next as any).attributes?.nextRegion;
    }
    sortedIds.forEach((id) => {
      var r = region(id);
      if (r) console.log(r.start, r.end);
    });
    return sortedIds;
  };

  const wsAddOrRemoveRegion = () => {
    if (
      currentRegion() &&
      (singleRegionRef.current ||
        isNear(currentRegion().start) ||
        isNear(currentRegion().end))
    )
      return wsRemoveSplitRegion(false);
    else return wsSplitRegion(currentRegion(), progress());
  };

  function wsAutoSegment(loop: boolean = false, params: IRegionParams) {
    if (!ws) return 0;
    var regions = mergeVerses(extractRegions(params));
    paramsRef.current = params;
    loadRegions({ params: params, regions: regions }, loop, true);
    onRegion(regions.length, true);
    if (regions.length) goto(regions[0].start);
    return regions.length;
  }
  const wsPrevRegion = () => {
    var r = findPrevRegion(currentRegion());
    var newPlay = true;
    if (r) {
      onStartRegion && onStartRegion(r.start);
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
      onStartRegion && onStartRegion(r.start);
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
    if (!ws || !Regions) return '{}';

    var regions = getSortedIds().map(function (id) {
      let r = region(id);
      if (r)
        return {
          start: r.start,
          end: r.end,
        };
      else return {};
    });
    return JSON.stringify({ params: paramsRef.current, regions: regions });
  };

  const wsLoopRegion = (loop: boolean) => {
    loopingRef.current = loop;
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
  function roundToTenths(n: number) {
    return Math.round(n * 10) / 10;
  }
  function resetPlayingRegion() {
    playRegionRef.current = false;
  }
  function justPlayRegion(progress: number) {
    if (
      currentRegion() &&
      !currentRegion().loop &&
      roundToTenths(currentRegion().start) <= roundToTenths(progress) && //account for discussion topic rounding
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
        if (ws?.isPlaying()) {
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
    setCurrentRegion(findRegion(position, true));
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
    resetPlayingRegion,
    onRegionSeek,
    onRegionProgress,
    onRegionGoTo,
    currentRegion,
  };
}
