import Axios, { HttpStatusCode } from 'axios';
import { getFingerprint } from '.';
import { API_CONFIG } from '../api-variable';

export const axiosGetStream = async (
  api: string,
  params?: any,
  token?: string
) => {
  api = API_CONFIG.host + '/api/' + api;
  //couldn't get axios to return a stream so use fetch
  const response = await fetch(api);
  if (response.status === HttpStatusCode.Ok) return response;
  if (response.status === HttpStatusCode.InternalServerError)
    throw new Error(response.statusText);
  return undefined;
};

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
          'Content-Type': 'application/json',
        }
      : { 'X-FP': fp, 'Content-Type': 'application/json' },
  });
};

export const axiosPostFile = async (
  api: string,
  file: File,
  token?: string
) => {
  // Create a FormData object
  const formData = new FormData();

  // Append the file to the FormData object
  formData.append('file', file);
  // Send the POST request with axios
  return await Axios.post(API_CONFIG.host + '/api/' + api, formData, {
    headers: token
      ? {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'multipart/form-data',
        }
      : {
          'Content-Type': 'multipart/form-data',
        },
  });
};
