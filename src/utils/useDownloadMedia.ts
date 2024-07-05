import { dataPath, PathType } from './dataPath';
import path from 'path-browserify';
const ipc = (window as any)?.electron;

export const useDownloadMedia = () => {
  const safeURL = async (path: string) => {
    if (!path.startsWith('http')) {
      const start = (await ipc?.isWindows()) ? 8 : 7;
      const url = new URL(`file://${path}`).toString().slice(start);
      return `transcribe-safe://${url}`;
    }
    return path;
  };
  const tryDownload = async (url: string, safe: boolean) => {
    var local = { localname: '' };
    var where = await dataPath(url, PathType.MEDIA, local);
    console.log('tryDownload', where, local.localname, url);
    if (where !== local.localname) {
      try {
        ipc?.createFolder(path.dirname(local.localname));
        await ipc?.downloadFile(url, local.localname);
        if (await ipc?.exists(local.localname)) {
          if (safe) return await safeURL(local.localname);
          return local.localname;
        } else return url;
      } catch (e: any) {
        return url;
      }
    }
    return local.localname;
  };
  return { tryDownload, safeURL };
};
