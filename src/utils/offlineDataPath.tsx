import path from 'path';
import os from 'os';

export const OfflineDataPath = (): string =>
  path.join(os.homedir(), process.env.REACT_APP_OFFLINEDATA || '');
