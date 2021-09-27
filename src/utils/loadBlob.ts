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
  setBlob: (urlorError: string, blob: Blob | undefined) => void
) => {
  if (!url) return;
  if (url.startsWith('http')) {
    fetch(url)
      .then(async (r) => setBlob(url, await r.blob()))
      .catch((e) => setBlob(e as string, undefined));
  } else {
    try {
      const source = fs.readFileSync(
        decodeURIComponent(url.replace(`transcribe-safe://`, ``))
      );
      setBlob(url, new Blob([source], { type: urlType(url) }));
    } catch (e: any) {
      setBlob(e.message, undefined);
    }
  }
};
export default loadBlob;
