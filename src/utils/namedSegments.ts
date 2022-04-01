import { tryParseJSON } from '.';
import { INamedRegion } from '../crud/useWavesurferRegions';

export enum NamedRegions {
  Transcription = 'Transcription',
  BackTranslation = 'BT',
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
