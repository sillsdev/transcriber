const request = require('request');
const fs = require('fs-extra');
/**
 * Promise based download file method
 * See: https://ourcodeworld.com/articles/read/228/how-to-download-a-webfile-with-electron-save-it-and-show-download-progress
 */

const downloadMap = new Map();
const downloadStatus = (token) => {
  return JSON.stringify(downloadMap.get(token));
};
const downloadClose = (token) => {
  if (downloadMap.has(token)) downloadMap.delete(token);
};

function downloadFile(url, localPath, token) {
  return new Promise(async function (resolve, reject) {
    let key = undefined;
    let received_bytes = 0;
    let total_bytes = 0;
    let error = null;

    const req = request({
      method: 'GET',
      uri: url,
    });

    const out = fs.createWriteStream(localPath);
    req.pipe(out);

    req.on('response', function (data) {
      total_bytes = parseInt(data.headers['content-length'] || '');
      if (isNaN(total_bytes)) {
        error = new Error('Invalid content-length');
      }
      if (token) {
        downloadMap.set(token, {
          received: 0,
          total: total_bytes,
          error: error,
        });
        key = token;
      }
    });

    req.on('data', function (chunk) {
      received_bytes += chunk.length;
      if (key) {
        const status = downloadMap.get(key);
        downloadMap.set(key, { ...status, received: received_bytes });
      }
    });

    req.on('error', function (err) {
      error = err;
      if (key) {
        const status = downloadMap.get(key);
        downloadMap.set(key, { ...status, error });
      }
    });

    out.on('finish', function () {
      var err = error;
      if (key) {
        err = downloadMap.get(key).error;
      }
      if (err) {
        fs.unlink(localPath);
        reject(err);
      } else {
        resolve();
      }
    });
    out.on('error', function (err) {
      error = err;
      if (key) {
        const status = downloadMap.get(key);
        downloadMap.set(key, { ...status, error });
      }
    });
  });
}

module.exports = { downloadFile, downloadStatus, downloadClose };
