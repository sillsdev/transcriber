import { isElectron } from '../api-variable';
var temp = isElectron ? require('electron').remote.getGlobal('temp') : '';
const fs = isElectron ? require('fs-extra') : null;
const path = require('path');

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

export const launchCmd = (target: string) => {
  if (!temp) throw new Error('Unable to find temp directory.'); //this is app.getPath('temp')
  const tempName = path.join(temp, 'transcriber-cmd.ps1');
  fs.writeFileSync(tempName, target, { encoding: 'utf-8' });
  execa(`powershell`, [tempName]).finally(() => {
    fs.unlinkSync(tempName);
  });
};

export default launch;
