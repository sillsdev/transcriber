import { logError, Severity } from '.';
import { isElectron } from '../api-variable';
var fs = isElectron ? require('fs') : undefined;

interface MimeMap {
  [key: string]: string;
}

const mimeMap: MimeMap = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/x-m4a',
  ogg: 'audio/ogg',
  itf: 'application/itf',
  ptf: 'application/ptf',
  jpg: 'image/jpeg',
  svg: 'image/svg+xml',
  png: 'image/png',
};

export const fileAsUrl = (fullName: string, reporter?: any) => {
  try {
    const encoding = 'base64';
    const data = fs.readFileSync(new URL(`file:///${fullName}`), { encoding });
    const ext = fullName.split('.').pop() || '';
    const mime = mimeMap.hasOwnProperty(ext) ? mimeMap[ext] : '';
    return `data:${mime};${encoding},${data}`;
  } catch (error) {
    logError(Severity.error, reporter, error);
  }
};

export default fileAsUrl;
