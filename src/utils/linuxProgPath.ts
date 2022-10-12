const os = require('os');
const isElectron = process.env.REACT_APP_MODE === 'electron';
var fs = isElectron ? require('fs-extra') : null;

export const linuxProgPath = () => {
  if (os.platform() === 'win32') return undefined;
  if (fs.existsSync('/snap/audio-project-manager/current/resources')) {
    return '/snap/audio-project-manager/current';
  }
  if (fs.existsSync('/usr/lib/audio-project-manager/resources')) {
    return '/usr/lib/audio-project-manager';
  }
  if (fs.existsSync('/opt/Audio Project Manager Desktop')) {
    return '/opt/Audio Project Manager Desktop/audio-project-manager';
  }
  return undefined;
};
