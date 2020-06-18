import { isElectron } from '../api-variable';
import { launch } from '.';

const noop = {} as any;
const os = isElectron ? require('os') : noop;
const path = isElectron ? require('path') : noop;

export const resetData = () => {
  if (isElectron) {
    if (os.platform() === 'win32') {
      launch(path.join(process.resourcesPath, 'resetData.bat'), false);
    } else {
      launch(path.join(process.resourcesPath, 'resetData.sh'), false);
    }
  }
};

export default resetData;
