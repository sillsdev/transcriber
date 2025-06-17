const ipc = (window as any)?.electron;

interface MimeMap {
  [key: string]: string;
}

export const mimeMap: MimeMap = {
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

export const loadBlob = async (
  url: string,
  setBlob: (urlorError: string, blob: Blob | undefined) => void
) => {
  if (!url) return;
  loadBlobAsync(url)
    .then((blob) => setBlob(url, blob))
    .catch((e) => setBlob(e?.message || e.toString(), undefined));
};
export const loadBlobAsync = async (url: string) => {
  if (!url) return;
  let iTries = 5;
  let lastErr = '';
  while (iTries) {
    try {
      if (url.startsWith('http')) {
        var r = await fetch(url);
        return await r.blob();
      } else {
        const source = await ipc?.read(
          decodeURIComponent(url.replace(`transcribe-safe://`, ``))
        );
        return new Blob([source], { type: urlType(url) });
      }
    } catch (err: any) {
      if (err.message.includes('403')) throw err;
      //wait
      await new Promise((resolve) => setTimeout(resolve, 1000));
      lastErr = err.message;
    }
    iTries--;
  }
  throw lastErr;
};
export default loadBlob;
