import { getRegVal } from '.';
const ipc = (window as any)?.electron;

export const getAudacityExe = async () => {
  let audacityExe: string | undefined = 'audacity';
  if (await ipc?.isWindows()) {
    const key = 'HKCR\\Audacity.Project\\shell\\open\\command';
    const audacity = await getRegVal(key, '');
    audacityExe = audacity?.split('"')[0];
  }
  return audacityExe;
};
