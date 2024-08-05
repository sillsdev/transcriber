import { dataPath, PathType } from './dataPath';
import path from 'path-browserify';
const ipc = (window as any)?.electron;

export const useDownloadMedia = () => {
  const tryDownload = async (url: string, safe: boolean) => {
    var local = { localname: '' };
    var where = await dataPath(url, PathType.MEDIA, local);

    if (where !== local.localname) {
      try {
        ipc?.createFolder(path.dirname(local.localname));
        console.log('downloading', local.localname, url);
        await ipc?.downloadFile(url, local.localname);
        if (await ipc?.exists(local.localname)) {
          if (safe) return local.localname;
          return local.localname;
        } else return url;
      } catch (e: any) {
        return url;
      }
    }
    return local.localname;
  };
  return { tryDownload };
};
