import { MediaFile } from '../model';
import { mediaContentType } from './contentType';

export const isVisual = (m: MediaFile | undefined) =>
  !/^audio/i.test(mediaContentType(m));
