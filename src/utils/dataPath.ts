import path from 'path-browserify';
import parse from 'url-parse';
import { isElectron } from '../api-variable';
const ipc = (window as any)?.electron;

export enum PathType {
  AVATARS = 'avatars',
  LOGOS = 'logos',
  FONTS = 'fonts',
  MEDIA = 'media',
  ZIP = 'zip',
}

export const dataPath = async (
  relPath?: string,
  type?: PathType,
  local_out?: { localname: string }
): Promise<string> => {
  const homeDir = localStorage.getItem('home') ?? '';
  if (isElectron && process.env.REACT_APP_OFFLINEDATA) {
    var localName = '';
    switch (type) {
      case PathType.AVATARS:
      case PathType.LOGOS:
      case PathType.FONTS:
        localName = path.join(
          homeDir,
          process.env.REACT_APP_OFFLINEDATA,
          type,
          local_out?.localname || path.basename(relPath || '')
        );
        break;
      case PathType.MEDIA:
        const fileName = relPath?.startsWith('http')
          ? parse(relPath).pathname?.split('?')[0].split('/').pop() || ''
          : path.basename(relPath || '');
        localName = path.join(
          homeDir,
          process.env.REACT_APP_OFFLINEDATA,
          type,
          decodeURIComponent(fileName)
        );
        break;
      default:
      case PathType.ZIP:
        localName = path.join(
          homeDir,
          process.env.REACT_APP_OFFLINEDATA,
          local_out?.localname || path.basename(relPath || '')
        );
        break;
    }
    if (local_out) local_out.localname = localName;
    if (await ipc?.exists(localName)) return localName;
    //s3 paths look like https://sil-transcriber-userfiles-dev.s3.amazonaws.com/noorg/B14___01_2Thess______ENGESVN2DA.mp3?AWSAccessKeyId=xxx
    if (type === PathType.MEDIA && relPath?.includes('s3.amazonaws')) {
      // This logic handles names with slashes. Sholdn't nappen again
      const fileParts = parse(relPath).pathname?.split('?')[0].split('/') || [];
      const fileName = fileParts.slice(3).join('/');
      localName = path.join(
        homeDir,
        process.env.REACT_APP_OFFLINEDATA,
        type,
        decodeURIComponent(fileName)
      );
      if (local_out) local_out.localname = localName;
      if (await ipc?.exists(localName)) return localName;
    }
  }
  return relPath?.startsWith('http')
    ? relPath
    : process.env.REACT_APP_OFFLINEDATA
    ? path.join(homeDir, process.env.REACT_APP_OFFLINEDATA, relPath || '')
    : '';
};

export default dataPath;
