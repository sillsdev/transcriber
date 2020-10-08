import { isElectron } from '../api-variable';

const noop = {} as any;
const { shell } = isElectron ? require('electron') : { shell: noop };
const execa = isElectron ? require('execa') : noop;
const os = require('os');

export const launch = (target: string, online: boolean) => {
  if (online) shell.openExternal(target);
  else if (os.platform() === 'win32') shell.openItem(target);
  else {
    const cmd = /\.sh/i.test(target) ? '' : 'xdg-open ';
    execa.command(`${cmd}${target}`, {
      env: { ...{ ...process }.env, DISPLAY: ':0' },
    });
  }
};

export default launch;
