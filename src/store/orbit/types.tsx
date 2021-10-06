import { Exception } from '@orbit/core';

// Describing the shape of the orbit's slice of state

export interface IApiError extends Exception {
  response: {
    status: number;
  };
}
export interface IFetchResults {
  syncBuffer: Buffer;
  syncFile: string;
  goRemote: boolean;
}

export interface IOrbitState {
  status: number | undefined;
  message: string;
  details?: string;
  saving: boolean;
  retry: number;
  fetchResults: IFetchResults | undefined;
}

// Describing the different ACTION NAMES available
export const FETCH_ORBIT_DATA = 'FETCH_ORBIT_DATA';
export const FETCH_ORBIT_DATA_COMPLETE = 'FETCH_ORBIT_DATA_COMPLETE';
export const ORBIT_ERROR = 'ORBIT_ERROR';
export const ORBIT_RETRY = 'ORBIT_RETRY';
export const RESET_ORBIT_ERROR = 'RESET_ORBIT_ERROR';
export const LOAD_TABLE = 'LOAD_TABLE';
export const ORBIT_SAVING = 'ORBIT_SAVING';

interface OrbitMsg {
  type: typeof FETCH_ORBIT_DATA;
  payload: IFetchResults;
}

interface OrbitLoadedMsg {
  type: typeof FETCH_ORBIT_DATA_COMPLETE;
}

interface OrbitErrorMsg {
  type: typeof ORBIT_ERROR;
  payload: IApiError;
}

interface OrbitRetryMsg {
  type: typeof ORBIT_RETRY;
  payload: IApiError;
}

interface ResetOrbitErrorMsg {
  type: typeof RESET_ORBIT_ERROR;
}

interface LoadTableMsg {
  type: typeof LOAD_TABLE;
  payload: string;
}

interface SavingMsg {
  type: typeof ORBIT_SAVING;
  payload: boolean;
}

export type OrbitMsgs =
  | OrbitMsg
  | OrbitLoadedMsg
  | OrbitErrorMsg
  | OrbitRetryMsg
  | ResetOrbitErrorMsg
  | LoadTableMsg
  | SavingMsg;
