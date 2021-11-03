import { getRegVal } from '.';
const os = require('os');

export const getAudacityExe = async () => {
  let audacityExe: string | undefined = 'audacity';
  if (os.platform() === 'win32') {
    const key = 'HKCR\\Audacity.Project\\shell\\open\\command';
    const audacity = await getRegVal(key, '');
    audacityExe = audacity?.split('"')[0];
  }
  return audacityExe;
};
