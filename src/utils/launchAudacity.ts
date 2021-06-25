import { IExeca } from '../model';
import { dataPath, PathType, getRegVal } from '.';
import { API_CONFIG } from '../api-variable';
const isElectron = process.env.REACT_APP_MODE === 'electron';
const execa = isElectron ? require('execa') : null;

export const launchAudacity = async (proj: string, mediaName?: string) => {
  const key = 'HKCR\\Python.CompiledFile\\shell\\open\\command';
  const python = await getRegVal(key, '');
  const pythonExe = python?.split(' ')[0].split('"')[0];
  const args = ['audacity-pipe.py', `"${proj}"`];
  if (mediaName && mediaName !== '') {
    const curPath = dataPath(mediaName, PathType.MEDIA);
    args.push(`"${curPath}"`);
  }
  execa(pythonExe, args, {
    shell: true,
    detached: true,
    cwd: API_CONFIG.resourcePath,
    env: { ...{ ...process }.env },
  })
    .then((res: IExeca) => {
      console.log(res);
      if (typeof res.stdout === 'string') {
        res.stdout.split('\n').forEach((ln: string) => {
          console.log(ln);
        });
      }
    })
    .catch((err: any) => {
      console.error(JSON.stringify(err, null, 2));
      err.stdout.split('\n').forEach((ln: string) => {
        console.log(ln);
      });
    });
};
