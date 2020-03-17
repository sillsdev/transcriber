import path from 'path';
import os from 'os';

export const DataPath = (relPath?: string): string => {
  return process.env.REACT_APP_OFFLINEDATA
    ? relPath
      ? path.join(os.homedir(), process.env.REACT_APP_OFFLINEDATA, relPath)
      : path.join(os.homedir(), process.env.REACT_APP_OFFLINEDATA)
    : relPath || '';
};

export default DataPath;
