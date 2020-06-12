const os = require('os');
const isElectron = process.env.REACT_APP_MODE === 'electron';
var fs = isElectron ? require('fs-extra') : null;

export const linuxProgPath = () => {
  if (os.platform() === 'win32') return undefined;
  if (fs.existsSync('/snap/sil-transcriber/current/resources')) {
    return '/snap/sil-transcriber/current';
  }
  if (fs.existsSync('/usr/lib/sil-transcriber/resources')) {
    return '/usr/lib/sil-transcriber';
  }
  if (fs.existsSync('/opt/SIL Transcriber Desktop Extension')) {
    return '/opt/SIL Transcriber Desktop Extension/sil-transcriber';
  }
  return undefined;
};
