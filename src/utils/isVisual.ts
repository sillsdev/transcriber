import { MediaFile } from '../model';

export const isVisual = (m: MediaFile | undefined) =>
  /\.pdf$/i.test(m?.attributes?.originalFile || '');
