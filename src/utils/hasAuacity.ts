import { getRegVal } from '.';
import { getWhereis } from './getWhereis';
const ipc = (window as any)?.electron;

const key = 'HKCR\\Audacity.Project\\shell\\open\\command';

export const hasAudacity = async () => {
  if (await ipc?.isWindows()) {
    return Boolean(await getRegVal(key, ''));
  } else {
    return (await getWhereis('audacity')).length > 0;
  }
};
