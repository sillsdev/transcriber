const os = require('os');
const path = require('path');
const isElectron = process.env.REACT_APP_MODE === 'electron';
const execa = isElectron ? require('execa') : null;

const progVal9 = 'Program_Files_Directory_Ptw9';
const progVal8 = 'Program_Files_Directory_Ptw8';
const dataVal = 'Settings_Directory';
const regKey = 'HKLM\\SOFTWARE\\WOW6432Node\\Paratext\\8';
interface Iexeca {
  stdout: string;
}
const lnRe = /([A-Za-z0-9_]+)[^A-Za-z0-9_]+([A-Za-z0-9_]+)[^A-Za-z0-9_]+(.*)/;

const getRegVal = async (key: string, name: string) => {
  const { stdout } = (await execa('reg', ['query', key])) as Iexeca;
  // console.log(stdout);
  let val = stdout
    .split('\n')
    .map((ln) => {
      const match = lnRe.exec(ln);
      return match && match[1] === name ? match[3] : undefined;
    })
    .filter((r) => r);
  return val.length > 0 ? val[0] : '';
};

export const getParatextDataPath = async () => {
  if (os.platform() === 'win32') {
    return await getRegVal(regKey, dataVal);
  } else {
    const regKeyFile = path.join(
      os.homedir(),
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
    const fileJson = require('./fileJson');
    const keyJson = fileJson(regKeyFile);
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

export const getParatextProgPath = async () => {
  if (os.platform() === 'win32') {
    return (
      (await getRegVal(regKey, progVal9)) || (await getRegVal(regKey, progVal8))
    );
  } else {
    return '/usr/bin/paratext/';
  }
};
