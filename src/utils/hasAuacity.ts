import { getRegVal } from '.';
import { getWhereis } from './getWhereis';
const os = require('os');

const key = 'HKCR\\Audacity.Project\\shell\\open\\command';

export const hasAudacity = async () => {
  if (os.platform() === 'win32') {
    return Boolean(await getRegVal(key, ''));
  } else {
    return (await getWhereis('audacity')).length > 0;
  }
};
