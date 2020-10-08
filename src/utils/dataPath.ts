import path from 'path';
import os from 'os';

export const dataPath = (relPath?: string): string => {
  return process.env.REACT_APP_OFFLINEDATA
    ? relPath
      ? path.join(os.homedir(), process.env.REACT_APP_OFFLINEDATA, relPath)
      : path.join(os.homedir(), process.env.REACT_APP_OFFLINEDATA)
    : relPath && relPath.startsWith('http')
    ? relPath
    : '';
};

export default dataPath;
