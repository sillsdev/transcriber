import { isElectron } from '../api-variable';
const ipc = (window as any)?.electron;

export const exitElectronApp = () => {
  if (isElectron) {
    ipc?.closeApp();
  }
};

export const relaunchApp = () => {
  if (isElectron) {
    ipc?.relaunchApp();
  }
};

export const exitApp = () => {
  if (isElectron) {
    ipc?.exitApp();
  }
};

export default exitElectronApp;
