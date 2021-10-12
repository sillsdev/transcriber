import { getRegVal } from '.';
const os = require('os');

export const getPythonExe = async () => {
  let pythonExe: string | undefined = 'python3';
  if (os.platform() === 'win32') {
    const key = 'HKCR\\Python.CompiledFile\\shell\\open\\command';
    const python = await getRegVal(key, '');
    pythonExe = python?.split(' ')[0].split('"')[0];
  }
  return pythonExe;
};
