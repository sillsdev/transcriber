import Axios from 'axios';
import { getFingerprint } from '.';
import { API_CONFIG } from '../api-variable';
import Auth from '../auth/Auth';

export const axiosGet = async (api: string, params?: any, auth?: Auth) => {
  api = API_CONFIG.host + '/api/' + api;
  return await Axios.get(api, {
    params: params,
    headers: auth
      ? {
          Authorization: 'Bearer ' + auth.accessToken,
        }
      : {},
  });
};
export const axiosPost = async (api: string, data: any, auth?: Auth) => {
  var fp = await getFingerprint();
  return await Axios.post(API_CONFIG.host + '/api/' + api, data, {
    headers: auth
      ? {
          Authorization: 'Bearer ' + auth.accessToken,
          'X-FP': fp,
        }
      : { 'X-FP': fp },
  });
};
