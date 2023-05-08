import { isElectron } from '../api-variable';
const ipc = (window as any)?.electron;

export const exitElectronApp = () => {
  if (isElectron) {
    ipc?.closeApp();
  }
};

export const relaunchApp = async () => {
  if (isElectron) {
    await ipc?.relaunchApp();
  }
};

export const exitApp = async () => {
  if (isElectron) {
    await ipc?.exitApp();
  }
};

export default exitElectronApp;
