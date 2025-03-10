import { tryParseJSON } from './tryParseJson';
import { INamedRegion, parseRegions } from '../crud/useWavesurferRegions';

export enum NamedRegions {
  Transcription = 'Transcription',
  BackTranslation = 'BT',
  ProjectResource = 'ProjRes',
  Verse = 'Verse',
  TRTask = 'TRTask',
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
      if (fornamesegs) {
        json[index]['regionInfo'] = fornamesegs;
      } else {
        json.splice(index, 1); //remove it
      }
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
    if (thisone?.regionInfo) {
      var ri = thisone?.regionInfo;
      if (typeof ri === 'object') return JSON.stringify(ri);
      return thisone.regionInfo.toString();
    }
    return '{}';
  }
  //old style
  if (name === NamedRegions.Transcription) return segments;
  return '{}';
}

export function getSortedRegions(segments: string) {
  return parseRegions(segments).regions.sort((i, j) => i.start - j.start);
}
