const ipc = (window as any)?.electron;
const path = require('path-browserify');

export const launch = async (target: string, online: boolean) => {
  if (/\.pdf$/i.test(target)) target = target.slice(18);
  if (online) ipc?.openExternal(target);
  else if (await ipc?.isWindows()) ipc?.openPath('file:///' + target);
  else {
    console.log(`launching ${target}`);
    const cmd = /\.sh/i.test(target) ? '' : 'xdg-open ';
    ipc?.exeCmd(`${cmd}${target}`, {
      env: { ...{ ...process }.env, DISPLAY: ':0' },
    });
  }
};

export const launchCmd = async (target: string) => {
  const temp = await ipc?.temp();
  if (!temp) throw new Error('Unable to find temp directory.'); //this is app.getPath('temp')
  if (await ipc?.isWindows()) {
    const tempName = path.join(temp, 'transcriber-cmd.ps1');
    await ipc?.write(tempName, target);
    ipc?.exec(`powershell`, [tempName]).finally(async () => {
      await ipc?.delete(tempName);
    });
  } else {
    const tempName = path.join(temp, 'transcriber-cmd.sh');
    ipc?.write(tempName, target);
    ipc
      ?.exec(`sh`, [tempName], {
        env: { ...{ ...process }.env, DISPLAY: ':0' },
      })
      .finally(async () => {
        await ipc?.unlinkSync(tempName);
      });
  }
};

export default launch;
