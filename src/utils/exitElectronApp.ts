import { isElectron } from '../api-variable';

const noop = {} as any;

const electronremote = isElectron ? require('@electron/remote') : noop;

export const exitElectronApp = () => {
  if (isElectron) {
    let w = electronremote.getCurrentWindow();
    w.close();
  }
};

export const relaunchApp = () => {
  if (isElectron) {
    electronremote.app.relaunch();
  }
};

export const exitApp = () => {
  if (isElectron) {
    electronremote.app.exit();
  }
};

export default exitElectronApp;
