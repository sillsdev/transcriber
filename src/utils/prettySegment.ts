import { IRegion } from '../crud/useWavesurferRegions';

const onePlace = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

export const prettySegment = (region: IRegion | undefined | string) => {
  var rgn: IRegion | undefined = undefined;
  if (typeof region === 'string') {
    if (region) rgn = JSON.parse(region) as IRegion;
  } else rgn = region;
  if (rgn) return `${onePlace(rgn.start)}-${onePlace(rgn.end)} `;
  return '';
};
