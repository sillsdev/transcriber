import { isElectron } from '../api-variable';
const ipc = isElectron ? require('electron').ipcRenderer : null;
const fs = isElectron ? require('fs-extra') : null;
const path = require('path');

const noop = {} as any;
const { shell } = isElectron ? require('electron') : { shell: noop };
const execa = isElectron ? require('execa') : noop;
const os = require('os');

export const launch = (target: string, online: boolean) => {
  if (/\.pdf$/i.test(target)) target = target.slice(18);
  if (online) shell.openExternal(target);
  else if (os.platform() === 'win32') shell.openPath('file:///' + target);
  else {
    console.log(`launching ${target}`);
    const cmd = /\.sh/i.test(target) ? '' : 'xdg-open ';
    execa.command(`${cmd}${target}`, {
      env: { ...{ ...process }.env, DISPLAY: ':0' },
    });
  }
};

export const launchCmd = async (target: string) => {
  const temp = await ipc?.invoke('temp');
  if (!temp) throw new Error('Unable to find temp directory.'); //this is app.getPath('temp')
  if (os.platform() === 'win32') {
    const tempName = path.join(temp, 'transcriber-cmd.ps1');
    fs.writeFileSync(tempName, target, { encoding: 'utf-8' });
    execa(`powershell`, [tempName]).finally(() => {
      fs.unlinkSync(tempName);
    });
  } else {
    const tempName = path.join(temp, 'transcriber-cmd.sh');
    fs.writeFileSync(tempName, target, { encoding: 'utf-8' });
    execa(`sh`, [tempName], {
      env: { ...{ ...process }.env, DISPLAY: ':0' },
    }).finally(() => {
      fs.unlinkSync(tempName);
    });
  }
};

export default launch;
