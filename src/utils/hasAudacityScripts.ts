import fs from 'fs';
import path from 'path';
import { isElectron } from '../api-variable';
import { getFiles } from '.';
const ipc = isElectron ? require('electron').ipcRenderer : null;
const os = require('os');

const prefsName = async () => {
  if (os.platform() === 'win32') {
    const appData = await ipc?.invoke('appData');
    return path.join(appData, 'audacity', 'audacity.cfg');
  } else {
    const home = await ipc?.invoke('home');
    for await (const fullName of getFiles(path.join(home, 'snap'))) {
      if (fullName.indexOf('audacity.cfg') > 0) return fullName;
    }
  }
};

const getAllPref = async (prefs: string) => {
  if (!fs.existsSync(prefs)) return false;
  return fs.readFileSync(prefs, 'utf-8');
};

const getScriptPref = (content: string) => {
  return /mod-script-pipe=([01234])/.exec(content);
};

export const hasAuacityScripts = async () => {
  const prefs = await prefsName();
  if (prefs === undefined) return false;
  const content = await getAllPref(prefs);
  const m = content && getScriptPref(content);
  return Boolean(m && m[1] === '1');
};

export const enableAudacityScripts = async () => {
  const prefs = await prefsName();
  if (prefs === undefined) return false;
  const content = await getAllPref(prefs);
  if (!content) return;
  const m = getScriptPref(content);
  if (!m) return;
  const pos = content.indexOf(m[0]) + m[0].length - 1;
  const data = content.slice(0, pos) + '1' + content.slice(pos + 1);
  fs.writeFileSync(prefs, data);
};
