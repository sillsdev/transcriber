import { isElectron } from '../api-variable';

const noop = {} as any;

const remote = isElectron ? require('electron').remote : noop;

export const exitElectronApp = () => {
  if (isElectron) {
    let w = remote.getCurrentWindow();
    w.close();
  }
};

export default exitElectronApp;
