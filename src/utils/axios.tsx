import Axios from 'axios';
import { getFingerprint } from '.';
import { API_CONFIG } from '../api-variable';

export const axiosGet = async (api: string, params?: any, token?: string) => {
  api = API_CONFIG.host + '/api/' + api;
  return await Axios.get(api, {
    params: params,
    headers: token
      ? {
          Authorization: 'Bearer ' + token,
        }
      : {},
  });
};
export const axiosPost = async (api: string, data: any, token?: string) => {
  var fp = await getFingerprint();
  return await Axios.post(API_CONFIG.host + '/api/' + api, data, {
    headers: token
      ? {
          Authorization: 'Bearer ' + token,
          'X-FP': fp,
        }
      : { 'X-FP': fp },
  });
};
