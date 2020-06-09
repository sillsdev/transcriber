import { isElectron } from '../api-variable';

const noop = {} as any;
const os = isElectron ? require('os') : noop;
const path = isElectron ? require('path') : noop;
const execa = isElectron ? require('execa') : noop;

const { shell } = isElectron ? require('electron') : { shell: noop };

export const resetData = () => {
  if (isElectron) {
    if (os.platform() === 'win32') {
      shell.openItem(path.join(process.resourcesPath, 'resetData.bat'));
    } else {
      execa('/bin/sh', [path.join(process.resourcesPath, 'resetData.sh')]);
    }
  }
};
