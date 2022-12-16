import { IExeca } from '../model';
import { getAudacityExe, logError, Severity, infoMsg } from '.';
const ipc = (window as any)?.electron;

export const launchAudacity = async (proj: string, reporter: any) => {
  const audacityExe = await getAudacityExe();
  const args = [`"${proj}"`];
  ipc
    ?.exec(`"${audacityExe}"`, args, {
      shell: true,
      detached: true,
      cwd: await ipc?.resourcePath(),
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
