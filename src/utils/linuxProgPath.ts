const ipc = (window as any)?.electron;

export const linuxProgPath = async () => {
  if (ipc?.platform() === 'win32') return undefined;
  if (await ipc?.exists('/snap/audio-project-manager/current/resources')) {
    return '/snap/audio-project-manager/current';
  }
  if (await ipc?.exists('/usr/lib/audio-project-manager/resources')) {
    return '/usr/lib/audio-project-manager';
  }
  if (await ipc?.exists('/opt/Audio Project Manager Desktop')) {
    return '/opt/Audio Project Manager Desktop/audio-project-manager';
  }
  return undefined;
};
