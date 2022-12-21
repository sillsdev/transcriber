import { getRegVal } from '.';
import { getWhereis } from './getWhereis';
const ipc = (window as any)?.electron;

const key = 'HKCR\\Python.CompiledFile\\shell\\open\\command';
export const hasPython = async () => {
  if (await ipc?.isWindows()) {
    return Boolean(await getRegVal(key, ''));
  } else {
    return (await getWhereis('python')).length > 0;
  }
};
