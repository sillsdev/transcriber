import path from 'path';
import os from 'os';
import url from 'url';
import { isElectron } from '../api-variable';
const fs = isElectron ? require('fs-extra') : null;

export enum PathType {
  AVATARS = 'avatars',
  LOGOS = 'logos',
  FONTS = 'fonts',
  MEDIA = 'media',
  ZIP = 'zip',
}

export const dataPath = (
  relPath?: string,
  type?: PathType,
  local_out?: { localname: string }
): string => {
  if (
    isElectron &&
    relPath?.startsWith('http') &&
    process.env.REACT_APP_OFFLINEDATA
  ) {
    var localName = '';
    switch (type) {
      case PathType.AVATARS:
      case PathType.LOGOS:
      case PathType.FONTS:
        localName = path.join(
          os.homedir(),
          process.env.REACT_APP_OFFLINEDATA,
          type,
          local_out?.localname || ''
        );
        break;
      case PathType.MEDIA:
        const fileName =
          url.parse(relPath).pathname?.split('?')[0].split('/').pop() || '';
        localName = path.join(
          os.homedir(),
          process.env.REACT_APP_OFFLINEDATA,
          type,
          decodeURIComponent(fileName)
        );
        break;
      case PathType.ZIP:
        localName = path.join(
          os.homedir(),
          process.env.REACT_APP_OFFLINEDATA,
          local_out?.localname || ''
        );
        break;
    }
    if (local_out) local_out.localname = localName;
    if (fs.existsSync(localName)) return localName;
  }
  return relPath?.startsWith('http')
    ? relPath
    : process.env.REACT_APP_OFFLINEDATA
    ? relPath
      ? path.join(os.homedir(), process.env.REACT_APP_OFFLINEDATA, relPath)
      : path.join(os.homedir(), process.env.REACT_APP_OFFLINEDATA)
    : '';
};

export default dataPath;
