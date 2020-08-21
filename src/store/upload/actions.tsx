import Axios from 'axios';
import { API_CONFIG } from '../../api-variable';
import Auth from '../../auth/Auth';
import { MediaFile } from '../../model';
import {
  UPLOAD_LIST,
  UPLOAD_ITEM_PENDING,
  UPLOAD_ITEM_CREATED,
  UPLOAD_ITEM_SUCCEEDED,
  UPLOAD_ITEM_FAILED,
  UPLOAD_COMPLETE,
} from './types';
import { infoMsg, logError, Severity } from '../../utils';

export const uploadFiles = (files: FileList) => (dispatch: any) => {
  dispatch({
    payload: files,
    type: UPLOAD_LIST,
  });
};

export const nextUpload = (
  record: MediaFile,
  files: FileList,
  n: number,
  auth: Auth,
  errorReporter: any,
  cb?: (n: number, success: boolean, data?: any) => void
) => (dispatch: any) => {
  dispatch({ payload: n, type: UPLOAD_ITEM_PENDING });
  Axios.post(API_CONFIG.host + '/api/mediafiles', record, {
    headers: {
      Authorization: 'Bearer ' + auth.accessToken,
    },
  })
    .then((response) => {
      dispatch({ payload: n, type: UPLOAD_ITEM_CREATED });
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', response.data.audioUrl, true);
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
