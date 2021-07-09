import { IExeca } from '../model';
import { getPythonExe } from '.';
import { API_CONFIG } from '../api-variable';
const isElectron = process.env.REACT_APP_MODE === 'electron';
const execa = isElectron ? require('execa') : null;

export const launchAudacityExport = async (
  projPath: string,
  cb: () => void
) => {
  const pythonExe = await getPythonExe();
  await execa(pythonExe, ['audacity-pipe-export.py', `"${projPath}"`], {
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
      cb();
    })
    .catch((err: any) => {
      console.error(JSON.stringify(err, null, 2));
      if (typeof err.stdout === 'string') {
        err.stdout.split('\n').forEach((ln: string) => {
          console.log(ln);
        });
      }
    });
};
