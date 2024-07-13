import { tryParseJSON } from './tryParseJson';
import {
  INamedRegion,
  IRegion,
  IRegionParams,
  parseRegions,
} from '../crud/useWavesurferRegions';

export enum NamedRegions {
  Transcription = 'Transcription',
  BackTranslation = 'BT',
  ProjectResource = 'ProjRes',
  Verse = 'Verse',
}
export function updateSegments(
  name: string,
  allsegs: string,
  fornamesegs: string
) {
  var json = tryParseJSON(allsegs);
  if (Array.isArray(json)) {
    var index = json.findIndex((j) => j['name'] === name);
    if (index >= 0) {
      json[index]['regionInfo'] = fornamesegs;
    } else {
      json.push({ name: name, regionInfo: fornamesegs });
    }
    return JSON.stringify(json);
  } else {
    //old style

    if (!allsegs || allsegs.length === 0 || name === NamedRegions.Transcription)
      return JSON.stringify([{ name: name, regionInfo: fornamesegs }]);
    else {
      return JSON.stringify([
        { name: name, regionInfo: fornamesegs },
        { name: NamedRegions.Transcription, regionInfo: allsegs },
      ]);
    }
  }
}

export function getSegments(name: string, segments: string) {
  var json = tryParseJSON(segments);
  if (Array.isArray(json)) {
    var thisone = json.find((j) => j['name'] === name) as INamedRegion;
    if (thisone?.regionInfo) return thisone.regionInfo.toString();
    return '{}';
  }
  //old style
  if (name === NamedRegions.Transcription) return segments;
  return '{}';
}

export function getSortedRegions(segments: string) {
  return parseRegions(segments).regions.sort((i, j) => i.start - j.start);
}

export interface MergedSegmentProps {
  from: NamedRegions;
  into: NamedRegions;
  params: IRegionParams;
  savedSegs: string;
}
export function mergedSegments({
  from,
  into,
  params,
  savedSegs,
}: MergedSegmentProps) {
  const segs = getSortedRegions(getSegments(from, savedSegs));
  const tsegs = getSortedRegions(getSegments(into, savedSegs));
  let x = 0;
  const suggested: IRegion[] = [];
  const minLen = params?.segLenThreshold || 0.5;
  segs.forEach((s) => {
    let i = tsegs.findIndex((t) => t.end > s.start);
    if (i < 0) {
      suggested.push(s);
    } else {
      suggested.push(...tsegs.slice(x, i));
      x = i;
      if (tsegs[i].start < s.start) {
        if (s.start - tsegs[i].start >= minLen) {
          suggested.push({ ...tsegs[i], end: s.start });
        } else {
          suggested[suggested.length - 1].end = s.start;
        }
      }
      if (tsegs[i].end - s.start >= minLen) {
        suggested.push({ ...s, end: tsegs[i].end });
      } else {
        x++; // skip the next one
        suggested.push({ ...s, end: tsegs[x].end });
      }
      x++;
    }
  });
  suggested.push(...tsegs.slice(x));
  return JSON.stringify({ regions: JSON.stringify(suggested) });
}
