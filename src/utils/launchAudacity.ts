import { IExeca } from '../model';
import { getAudacityExe, logError, Severity, infoMsg } from '.';
import { API_CONFIG } from '../api-variable';
const isElectron = process.env.REACT_APP_MODE === 'electron';
const execa = isElectron ? require('execa') : null;

export const launchAudacity = async (proj: string, reporter: any) => {
  const audacityExe = await getAudacityExe();
  const args = [`"${proj}"`];
  execa(`"${audacityExe}"`, args, {
    shell: true,
    detached: true,
    cwd: API_CONFIG.resourcePath,
    env: { ...{ ...process }.env },
  })
    .then((res: IExeca) => {
      if (typeof res?.stdout === 'string' && res.stdout.trim().length > 0) {
        const msg = `Launch Audacity Results:\n${res.stdout}`;
        logError(Severity.info, reporter, msg);
      }
    })
    .catch((err: any) => {
      const launchErr = 'Launch Audacity Error';
      if (typeof err?.stdout === 'string' && err.stdout.trim().length > 0) {
        let msg = `${launchErr}\n${err.stdout}`;
        logError(Severity.error, reporter, infoMsg(err, msg));
      } else {
        logError(Severity.error, reporter, infoMsg(err, launchErr));
      }
    });
};
