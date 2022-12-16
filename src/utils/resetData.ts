import { isElectron } from '../api-variable';
import { launch } from '.';

const noop = {} as any;
const path = isElectron ? require('path') : noop;
const ipc = (window as any)?.electron;

export const resetData = async () => {
  if (isElectron) {
    if (await ipc?.isWindows()) {
      launch(path.join(await ipc?.resourcePath(), 'resetData.bat'), false);
    } else {
      launch(path.join(await ipc?.resourcePath(), 'resetData.sh'), false);
    }
  }
};

export default resetData;
