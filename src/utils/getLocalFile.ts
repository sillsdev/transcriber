export {};

function getFileBlob(url: string, cb: (response: any) => void) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.responseType = 'blob';
  xhr.addEventListener('load', function () {
    cb(xhr.response);
  });
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
