import { AxiosError } from 'axios';

export interface IAxiosStatus {
  complete: boolean;
  statusMsg: string; //not sure we need this...
  errStatus: number; //0 no error?
  errMsg: string;
}

export const pendingStatus = (status: string): IAxiosStatus => {
  return { complete: false, statusMsg: status, errStatus: 0, errMsg: '' };
};
export const successStatus = (status: string): IAxiosStatus => {
  return { complete: true, statusMsg: status, errStatus: 0, errMsg: '' };
};
export const successStatusMsg = (status: string, msg: string): IAxiosStatus => {
  return { complete: true, statusMsg: status, errStatus: 0, errMsg: msg };
};
export const errStatus = (err: AxiosError): IAxiosStatus => {
  if (err.response) {
    // Request made and server responded
    console.log(err.response.data);
    if (Array.isArray(err.response.data.errors)) {
      let detail = err.response.data.errors[0];
      console.log(detail);
      console.log(detail.detail);
      err.message += ' Detail: ' + detail.detail;
    }
    console.log(err.response.status);
    console.log(err.response.headers);
  } else if (err.request) {
    // The request was made but no response was received

    console.log(err.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log(err);
  }
  return errorStatus(err.response ? err.response.status : -1, err.message);
};
export const errorStatus = (
  errNo: number | undefined,
  message: string
): IAxiosStatus => {
  return {
    complete: true,
    statusMsg: 'Error',
    errStatus: errNo ? errNo : -1,
    errMsg: message,
  };
};
