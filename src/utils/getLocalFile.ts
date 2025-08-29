export {};

function getFileBlob(url: string, cb: (response: any) => void) {
  let xhr = new XMLHttpRequest();
  const cleanup = () => {
    xhr.onload = null;
    xhr.onerror = null;
    xhr.onabort = null;
    // @ts-ignore
    xhr = null;
  };
  xhr.open('GET', url);
  xhr.responseType = 'blob';
  xhr.onload = async () => {
    cb(xhr.response);
    cleanup();
  };
  xhr.send();
}
var blobToFile = function (blob: Blob, name: string, mimeType: string) {
  return new File([blob], name, {
    type: mimeType,
  });
};

export const getFileObject = function (
  filePathOrUrl: string,
  name: string,
  mimeType: string,
  cb: (f: File) => void
) {
  getFileBlob(filePathOrUrl, function (blob) {
    cb(blobToFile(blob, name, mimeType));
  });
};
