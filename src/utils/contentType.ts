import path from 'path-browserify';
import { MediaFile } from '../model';

const extToContentType = (extension: string) => {
  if (extension.startsWith('.')) extension = extension.substring(1);
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'wav':
      return 'audio/wav';
    case 'm4a':
      return 'audio/m4a';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'ogg':
      return 'audio/ogg';
    case 'mp3':
      return 'audio/mpeg';
    case 'png':
      return 'image/png';
    default:
      return ''; // Default content type for unknown extensions
  }
};
export const getContentType = (
  contenttype: string | undefined,
  filename: string | undefined
) => {
  return contenttype || extToContentType(path.extname(filename ?? ''));
};
export const mediaContentType = (mf: MediaFile | undefined) => {
  if (!mf?.attributes) return '';
  return getContentType(mf.attributes.contentType, mf.attributes.originalFile);
};
