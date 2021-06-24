import { IExeca } from '../model';
import { dataPath, PathType } from '.';
import { API_CONFIG } from '../api-variable';
const isElectron = process.env.REACT_APP_MODE === 'electron';
const execa = isElectron ? require('execa') : null;

export const launchAudacity = async (mediaName: string) => {
  const curPath = dataPath(mediaName, PathType.MEDIA);
  const cmd = `python.exe audacity-pipe.py "${curPath}"`;
  console.log(`launching "${cmd}"`, API_CONFIG);
  execa(cmd, { cwd: API_CONFIG.resourcePath, detached: true })
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
