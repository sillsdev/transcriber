import { isElectron } from '../api-variable';

const noop = {} as any;

const electronremote = isElectron ? require('@electron/remote') : noop;

export const exitElectronApp = () => {
  if (isElectron) {
    let w = electronremote.getCurrentWindow();
    w.close();
  }
};

export default exitElectronApp;
