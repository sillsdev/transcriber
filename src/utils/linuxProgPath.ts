const os = require('os');
const isElectron = process.env.REACT_APP_MODE === 'electron';
var fs = isElectron ? require('fs-extra') : null;

export const linuxProgPath = () => {
  if (os.platform() === 'win32') return undefined;
  if (fs.existsSync('/snap/audiotext/current/resources')) {
    return '/snap/audiotext/current';
  }
  if (fs.existsSync('/usr/lib/audiotext/resources')) {
    return '/usr/lib/audiotext';
  }
  if (fs.existsSync('/opt/Audio Text Desktop')) {
    return '/opt/Audio Text Desktop/audiotext';
  }
  return undefined;
};
