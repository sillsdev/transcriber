import Axios, { AxiosError } from 'axios';
import { API_CONFIG } from '../../api-variable';
import Auth from '../../auth/Auth';
import {
  EXPORT_PENDING,
  EXPORT_SUCCESS,
  EXPORT_ERROR,
  EXPORT_COMPLETE,
} from './types';
import { pendingStatus, errStatus } from '../AxiosStatus';

export const exportComplete = () => (dispatch: any) => {
  dispatch({
    payload: undefined,
    type: EXPORT_COMPLETE,
  });
};

export const exportProject = (
  projectid: number,
  auth: Auth,
  pendingmsg: string
) => (dispatch: any) => {
  console.log('exportProject');
  dispatch({
    payload: pendingStatus(pendingmsg),
    type: EXPORT_PENDING,
  });

  console.log('calling axios');
  Axios.get(API_CONFIG.host + '/api/offlineData/project/' + projectid, {
    headers: {
      Authorization: 'Bearer ' + auth.accessToken,
    },
    responseType: 'arraybuffer',
    timeout: 30000,
  })
    .then(response => {
      var filename = response.headers['content-disposition'];
      var idx = filename.indexOf('filename=') + 'filename='.length;
      filename = filename.substring(idx);
      //new File() is not supported by all browsers...so fake it here
      dispatch({
        payload: { name: filename, data: new Blob([response.data]) },
        type: EXPORT_SUCCESS,
      });
    })
    .catch((err: AxiosError) => {
      console.log('export failed.');
      console.log(err);
      dispatch({
        payload: errStatus(err),
        type: EXPORT_ERROR,
      });
    });
};
