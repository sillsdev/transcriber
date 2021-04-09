import { isElectron } from '../api-variable';
const fs = isElectron ? require('fs') : null;

interface MimeMap {
  [key: string]: string;
}

const mimeMap: MimeMap = {
  mp3: 'audio/mpeg',
  webm: 'audio/webm;codecs=opus',
  mka: 'audio/webm;codecs=pcm',
  wav: 'audio/wav',
  m4a: 'audio/x-m4a',
  ogg: 'audio/ogg;codecs=opus',
  itf: 'application/itf',
  ptf: 'application/ptf',
  jpg: 'image/jpeg',
  svg: 'image/svg+xml',
  png: 'image/png',
};

const urlType = (url: string) => {
  const ext = url.split('.').pop() || '';
  return mimeMap.hasOwnProperty(ext) ? mimeMap[ext] : '';
};

export const loadBlob = (
  url: string,
  online: boolean,
  setBlob: (blob: Blob) => void
) => {
  if (!url) return;
  if (online) {
    fetch(url).then(async (r) => setBlob(await r.blob()));
  } else {
    const source = fs.readFileSync(url.replace(`transcribe-safe://`, ``));
    setBlob(new Blob([source], { type: urlType(url) }));
  }
};
export default loadBlob;
