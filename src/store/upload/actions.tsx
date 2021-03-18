import Axios from 'axios';
import { API_CONFIG, isElectron } from '../../api-variable';
import Auth from '../../auth/Auth';
import {
  UPLOAD_LIST,
  UPLOAD_ITEM_PENDING,
  UPLOAD_ITEM_CREATED,
  UPLOAD_ITEM_SUCCEEDED,
  UPLOAD_ITEM_FAILED,
  UPLOAD_COMPLETE,
} from './types';
import {
  dataPath,
  infoMsg,
  logError,
  PathType,
  Severity,
  createPathFolder,
} from '../../utils';
var fs = require('fs');
var path = require('path');

export const uploadFiles = (files: File[]) => (dispatch: any) => {
  dispatch({
    payload: files,
    type: UPLOAD_LIST,
  });
};
export const writeFileLocal = (file: File) => {
  var local = { localname: '' };
  dataPath(`http://${file.path}`, PathType.MEDIA, local);
  var fullName = local.localname;
  if (file.path === '') fullName += path.sep + file.name;
  createPathFolder(fullName);
  fs.writeFileSync(fullName, file);
  return path.join(
    PathType.MEDIA,
    file.path.split(path.sep).pop()
  );
}
export const nextUpload = (
  record: any,
  files: File[],
  n: number,
  auth: Auth,
  errorReporter: any,
  cb?: (n: number, success: boolean, data?: any) => void
) => (dispatch: any) => {
  dispatch({ payload: n, type: UPLOAD_ITEM_PENDING });
  const acceptExtPat = /\.wav$|\.mp3$|\.m4a$|\.ogg$/i;
  if (!acceptExtPat.test(record.originalFile)) {
    dispatch({
      payload: {
        current: n,
        error: `${files[n].name}:unsupported`,
      },
      type: UPLOAD_ITEM_FAILED,
    });
    if (cb) cb(n, false);
    return;
  }
  if (!auth.accessToken) {
    // offlineOnly
    try {
      var filename = writeFileLocal(files[n]);
      if (cb) cb(n, true, { ...record, audioUrl: filename });
    } catch (err) {
      if (cb) cb(n, false);
      console.log(err);
    }
    return;
  }
  Axios.post(API_CONFIG.host + '/api/mediafiles', record, {
    headers: {
      Authorization: 'Bearer ' + auth.accessToken,
    },
  })
    .then((response) => {
      dispatch({ payload: n, type: UPLOAD_ITEM_CREATED });
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', response.data.audioUrl, true);
      if (isElectron) {
        try {
          writeFileLocal(files[n]);
        } catch (err) {
          console.log(err);
        }
      }
      xhr.setRequestHeader('Content-Type', response.data.contentType);
      xhr.send(files[n].slice());
      xhr.onload = () => {
        if (xhr.status < 300) {
          dispatch({ payload: n, type: UPLOAD_ITEM_SUCCEEDED });
          if (cb) cb(n, true, response.data);
        } else {
          logError(
            Severity.info,
            errorReporter,
            `upload ${files[n].name}: (${xhr.status}) ${xhr.responseText}`
          );
          Axios.delete(
            API_CONFIG.host + '/api/mediafiles/' + response.data.id,
            {
              headers: {
                Authorization: 'Bearer ' + auth.accessToken,
              },
            }
          ).catch((err) => {
            logError(
              Severity.info,
              errorReporter,
              `unable to remove orphaned mediafile ${response.data.id}`
            );
          });
          dispatch({
            payload: {
              current: n,
              error: `upload ${files[n].name}: (${xhr.status}) ${xhr.statusText}`,
            },
            type: UPLOAD_ITEM_FAILED,
          });
          if (cb) cb(n, false);
        }
      };
    })
    .catch((err) => {
      logError(
        Severity.info,
        errorReporter,
        infoMsg(err, `Upload ${files[n].name} failed.`)
      );
      dispatch({
        payload: {
          current: n,
          error: `upload ${files[n].name}: (${err})`,
          mediaid: record.id,
        },
        type: UPLOAD_ITEM_FAILED,
      });
      if (cb) cb(n, false);
    });
};

export const uploadComplete = () => {
  return { type: UPLOAD_COMPLETE };
};
