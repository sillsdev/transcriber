import { fileJson, getRegVal } from '../utils';
const path = require('path-browserify');
const ipc = (window as any)?.electron;

const progVal91 = 'Paratext9_Full_Release_AppPath';
const progVal9 = 'Program_Files_Directory_Ptw9';
const progVal8 = 'Program_Files_Directory_Ptw8';
const dataVal = 'Settings_Directory';
const regKey = 'HKLM\\SOFTWARE\\WOW6432Node\\Paratext\\8';

export const getParatextDataPath = async () => {
  if (await ipc?.isWindows()) {
    return await getRegVal(regKey, dataVal);
  } else {
    const regKeyFile = path.join(
      await ipc?.home(),
      '.config',
      'paratext',
      'registry',
      'LocalMachine',
      'software',
      'paratext',
      '8',
      'values.xml'
    );
    let dir = null;
    const keyJson = await fileJson(regKeyFile);
    if (keyJson) {
      const vals = keyJson.values.value;
      if (Array.isArray(vals)) {
        for (let v of vals) {
          if (v._attributes.name === dataVal) {
            dir = v._text;
            break;
          }
        }
      } else {
        dir = vals._text;
      }
    }
    return dir;
  }
};

export const getReadWriteProg = async () => {
  if (await ipc?.isWindows()) {
    const progPath =
      (await getRegVal(regKey, progVal91)) ||
      (await getRegVal(regKey, progVal9)) ||
      (await getRegVal(regKey, progVal8));
    return async (args: string[]) => {
      return JSON.parse(await ipc?.exec(path.join(progPath, 'rdwrtp8'), args));
    };
  } else {
    return async (args: string[]) => {
      return JSON.parse(
        await ipc?.exec('/usr/bin/paratext9', ['--rdwrtp8'].concat(args), {
          env: { ...{ ...process }.env, DISPLAY: ':0' },
        })
      );
    };
  }
};
