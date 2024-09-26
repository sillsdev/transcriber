import { MediaFile } from '../model';

export const isVisual = (m: MediaFile | undefined) =>
  !/^audio/i.test(m?.attributes?.contentType || '');
