const request = require('request');
const fs = require('fs-extra');
/**
 * Promise based download file method
 * See: https://ourcodeworld.com/articles/read/228/how-to-download-a-webfile-with-electron-save-it-and-show-download-progress
 */
function downloadFile(url, localPath, onProgress) {
  return new Promise(async function (resolve, reject) {
    let received_bytes = 0;
    let total_bytes = 0;
    let error = null;

    const req = request({
      method: 'GET',
      uri: url,
    });

    const out = await fs.createStream(localPath);
    req.pipe(out);

    req.on('response', function (data) {
      total_bytes = parseInt(data.headers['content-length'] || '');
    });

    req.on('data', function (chunk) {
      received_bytes += chunk.length;
      onProgress && onProgress(received_bytes, total_bytes);
    });

    // req.on('end', function () {
    //   if (!error) resolve();
    // });

    req.on('error', function (err) {
      error = err;
      reject(err);
    });

    out.on('close', function () {
      if (!error) resolve(undefined);
    });

    out.on('error', function (err) {
      error = err;
      reject(err);
    });
  });
}

module.exports = downloadFile;
