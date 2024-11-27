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

export const axiosDelete = async (api: string, token?: string) => {
  api = API_CONFIG.host + '/api/' + api;
  return await Axios.delete(api, {
    headers: token
      ? {
          Authorization: 'Bearer ' + token,
        }
      : {},
  });
};
const fetchWithRetry = async (
  api: string,
  params?: any,
  token?: string | null,
  retries = 3,
  backoff = 300
) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await Axios.get(api, {
        params: params,
        headers: token
          ? {
              Authorization: 'Bearer ' + token,
            }
          : {},
      });
      return response.data;
    } catch (error) {
      if (i < retries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, backoff * Math.pow(2, i))
        );
      } else {
        throw error;
      }
    }
  }
};
export const axiosGet = async (
  api: string,
  params?: any,
  token?: string | null
) => {
  if (!api.startsWith(API_CONFIG.host)) api = API_CONFIG.host + '/api/' + api;
  return await fetchWithRetry(api, params, token);
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
export const axiosSendSignedUrl = async (
  api: string,
  signedUrl: string,
  token?: string
) => {
  return await Axios.post(
    API_CONFIG.host + '/api/' + api,
    {
      fileUrl: signedUrl,
    },
    {
      headers: token
        ? {
            Authorization: 'Bearer ' + token,
          }
        : {},
    }
  );
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
