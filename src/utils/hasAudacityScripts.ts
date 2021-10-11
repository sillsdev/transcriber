import fs from 'fs';
import path from 'path';
import { isElectron } from '../api-variable';
const ipc = isElectron ? require('electron').ipcRenderer : null;
const os = require('os');

export const audPrefsName = async () => {
  if (os.platform() === 'win32') {
    const appData = await ipc?.invoke('appData');
    return path.join(appData, 'audacity', 'audacity.cfg');
  } else {
    const home = await ipc?.invoke('home');
    const snapName = path.join(
      home,
      'snap',
      'audacity',
      'current',
      '.audacity-data',
      'audacity.cfg'
    );
    if (fs.existsSync(snapName)) return snapName;
    // const debName = path.join(home, '.audacity-data', 'audacity.cfg');
    // if (fs.existsSync(debName)) return debName;
  }
};

const getAllPref = async (prefs: string) => {
  if (!fs.existsSync(prefs)) return false;
  return fs.readFileSync(prefs, 'utf-8');
};

export const getAudPrefContent = async (inPrefs?: string) => {
  const prefs = inPrefs || (await audPrefsName());
  if (prefs === undefined) return false;
  return await getAllPref(prefs);
};

const getScriptPref = (content: string) => {
  return /mod-script-pipe=([01234])/.exec(content);
};

const getRecordChannels = (content: string) => {
  return /RecordChannels=([12])/.exec(content);
};

export const getMacroOutputMatch = (content: string) => {
  // return /\[Directories\/MacrosOut\]\nDefault=([^\n]+)/.exec(content || '');
  return /\[Directories\/MacrosOut\]\r?\nDefault=([^\n]+)/.exec(content || '');
};

export const setMacroOutputPath = (
  prefs: string,
  data: string,
  m: RegExpExecArray,
  to: string
) => {
  const pos = data.indexOf(m[0]) + m[0].length - m[1].length;
  const results = data.slice(0, pos) + to + data.slice(pos + m[1].length);
  fs.writeFileSync(prefs, results);
};

export const hasAuacityScripts = async () => {
  const content = await getAudPrefContent();
  const m = content && getScriptPref(content);
  return Boolean(m && m[1] === '1');
};

const changeValue = (data: string, m: RegExpExecArray) => {
  const pos = data.indexOf(m[0]) + m[0].length - 1;
  return data.slice(0, pos) + '1' + data.slice(pos + 1);
};

export const enableAudacityScripts = async () => {
  const prefs = await audPrefsName();
  if (prefs === undefined) return false;
  const content = await getAudPrefContent(prefs);
  if (!content) return;
  let changed = false;
  const m = getScriptPref(content);
  let data = content;
  if (m) {
    changed = true;
    data = changeValue(data, m);
  }
  const m1 = getRecordChannels(data);
  if (m1) {
    changed = true;
    data = changeValue(data, m1);
  }
  if (!changed) return;
  fs.writeFileSync(prefs, data);
};
