import fs from 'fs';
import path from 'path';
import { isElectron } from '../api-variable';
const ipc = isElectron ? require('electron').ipcRenderer : null;

const prefsName = async () => {
  const appData = await ipc?.invoke('appData');
  return path.join(appData, 'audacity', 'audacity.cfg');
};

const getAllPref = async (prefs: string) => {
  if (!fs.existsSync(prefs)) return false;
  return fs.readFileSync(prefs, 'utf-8');
};

const getScriptPref = async (content: string) => {
  return /mod-script-pipe=([01])/.exec(content);
};

export const hasAuacityScripts = async () => {
  const prefs = await prefsName();
  const content = await getAllPref(prefs);
  const m = content && (await getScriptPref(content));
  return Boolean(m && m[1] === '1');
};

export const enableAudacityScripts = async () => {
  const prefs = await prefsName();
  const content = await getAllPref(prefs);
  if (!content) return;
  const m = await getScriptPref(content);
  if (!m) return;
  const pos = content.indexOf(m[0]) + m[0].length - 1;
  const data = content.slice(0, pos) + '1' + content.slice(pos + 1);
  fs.writeFileSync(prefs, data);
};
