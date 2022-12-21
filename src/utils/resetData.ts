import { isElectron } from '../api-variable';
import { execFolder, launch } from '.';

const noop = {} as any;
const path = isElectron ? require('path-browserify') : noop;
const ipc = (window as any)?.electron;

export const resetData = async () => {
  if (isElectron) {
    const folder = path.join(await execFolder(), 'resources');
    if (await ipc?.isWindows()) {
      launch(path.join(folder, 'resetData.bat'), false);
    } else {
      launch(path.join(folder, 'resetData.sh'), false);
    }
  }
};

export default resetData;
