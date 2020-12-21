import request from 'request';
const fs = require('fs');
/**
 * Promise based download file method
 * See: https://ourcodeworld.com/articles/read/228/how-to-download-a-webfile-with-electron-save-it-and-show-download-progress
 */
interface IProps {
  url: string;
  localPath: string;
  onProgress?: (received: number, total: number) => void;
}
export function downloadFile(props: IProps) {
  return new Promise(function (resolve, reject) {
    let received_bytes = 0;
    let total_bytes = 0;
    let error: Error | null = null;

    const req = request({
      method: 'GET',
      uri: props.url,
    });

    const out = fs.createWriteStream(props.localPath);
    req.pipe(out);

    req.on('response', function (data) {
      total_bytes = parseInt(data.headers['content-length'] || '');
    });

    req.on('data', function (chunk) {
      received_bytes += chunk.length;
      props.onProgress && props.onProgress(received_bytes, total_bytes);
    });

    // req.on('end', function () {
    //   if (!error) resolve();
    // });

    req.on('error', function (err) {
      error = err;
      reject(err)
    })

    out.on('close', function () {
      if (!error) resolve();
    });

    out.on('error', function (err: Error) {
      error = err
      reject(err)
    })
  });
}
