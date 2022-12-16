import { isElectron } from '../api-variable';
import { launch } from '.';

const noop = {} as any;
const os = isElectron ? require('os') : noop;
const path = isElectron ? require('path') : noop;
const ipc = (window as any)?.electron;

export const resetData = async () => {
  if (isElectron) {
    if (os.platform() === 'win32') {
      launch(path.join(await ipc?.resourcePath(), 'resetData.bat'), false);
    } else {
      launch(path.join(await ipc?.resourcePath(), 'resetData.sh'), false);
    }
  }
};

export default resetData;
