import { isElectron } from '../api-variable';
const ipc = isElectron ? require('electron').ipcRenderer : null;
const path = require('path');
const os = require('os');

export const getMacroOutputName = async (mp3Name: string) => {
  if (os.platform() === 'win32') {
    const docs = await ipc?.invoke('getPath', 'documents');
    return path.join(docs, 'Audacity', 'macro-output', mp3Name);
  } else {
    const home = await ipc?.invoke('home');
    return path.join(
      home,
      'snap',
      'audacity',
      'current',
      'Documents',
      'macro-output',
      mp3Name
    );
  }
};
