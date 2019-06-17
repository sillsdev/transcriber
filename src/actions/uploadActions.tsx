import Axios from 'axios';
import { MediaFile } from '../model';
import { API_CONFIG } from '../api-variable';
import Auth from '../auth/Auth';
import {
  UPLOAD_LIST,
  UPLOAD_ITEM_PENDING,
  UPLOAD_ITEM_CREATED,
  UPLOAD_ITEM_SUCCEEDED,
  UPLOAD_ITEM_FAILED,
  UPLOAD_COMPLETE
} from './types';

export const uploadFiles = (files: FileList) => (dispatch: any) => {
  dispatch({
    payload: files,
    type: UPLOAD_LIST
  });
};

export const nextUpload = (
  record: MediaFile,
  files: FileList,
  n: number,
  auth: Auth
) => (dispatch: any) => {
  dispatch({ payload: n, type: UPLOAD_ITEM_PENDING });
  Axios.post(API_CONFIG.host + '/api/mediafiles', record, {
    headers: {
      Authorization: 'Bearer ' + auth.accessToken
    }
  })
    .then(response => {
      console.log('upload item created' + files[n].name + ' succeeded.');
      console.log(response);
      dispatch({ payload: n, type: UPLOAD_ITEM_CREATED });
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', response.data.audioUrl, true);
      xhr.send(files[n].slice());
      xhr.onload = () => {
        if (xhr.status < 300) {
          console.log('upload item ' + files[n].name + ' succeeded.');
          // console.log(JSON.stringify(xhr.response));
          dispatch({ payload: n, type: UPLOAD_ITEM_SUCCEEDED });
        } else {
          console.log('upload ' + files[n].name + ' failed.');
          console.log(JSON.stringify(xhr.response));
          dispatch({ payload: n, type: UPLOAD_ITEM_FAILED });
        }
      };
    })
    .catch(err => {
      console.log('upload ' + files[n].name + ' failed.');
      console.log(err);
      dispatch({ payload: n, type: UPLOAD_ITEM_FAILED });
    });
};

export const uploadComplete = () => {
  return { type: UPLOAD_COMPLETE };
};
