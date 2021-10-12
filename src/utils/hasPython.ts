import { getRegVal } from '.';
import { getWhereis } from './getWhereis';
const os = require('os');

const key = 'HKCR\\Python.CompiledFile\\shell\\open\\command';
export const hasPython = async () => {
  if (os.platform() === 'win32') {
    return Boolean(await getRegVal(key, ''));
  } else {
    return (await getWhereis('python')).length > 0;
  }
};
