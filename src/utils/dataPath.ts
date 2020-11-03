import path from 'path';
import os from 'os';
import url from 'url'
import {isElectron} from '../api-variable';
const fs = isElectron ? require('fs-extra') : null;

export const dataPath = (relPath?: string): string => {
  if (isElectron && relPath && process.env.REACT_APP_OFFLINEDATA) {
    const fileName = url.parse(relPath).pathname?.split('/').pop() || '';
    const localName = path.join(os.homedir(), process.env.REACT_APP_OFFLINEDATA, fileName);
    console.log(`Checking for ${localName}`)
    if (fs.existsSync(localName)) return localName;
  }
  return relPath && relPath.startsWith('http')
  ? relPath
  : process.env.REACT_APP_OFFLINEDATA
    ? relPath
      ? path.join(os.homedir(), process.env.REACT_APP_OFFLINEDATA, relPath)
      : path.join(os.homedir(), process.env.REACT_APP_OFFLINEDATA)
    :  '';
};

export default dataPath;
