import { Exception } from '@orbit/core';

// Describing the shape of the orbit's slice of state

export interface IApiError extends Exception {
  response: {
    status: number;
  };
}

export interface IOrbitState {
  loaded: boolean;
  status: number | undefined;
  message: string;
  saving: boolean;
}

// Describing the different ACTION NAMES available
export const FETCH_ORBIT_DATA = 'FETCH_ORBIT_DATA';
export const ORBIT_ERROR = 'ORBIT_ERROR';
export const RESET_ORBIT_ERROR = 'RESET_ORBIT_ERROR';
export const LOAD_TABLE = 'LOAD_TABLE';
export const ORBIT_SAVING = 'ORBIT_SAVING';

interface OrbitMsg {
  type: typeof FETCH_ORBIT_DATA;
}

interface OrbitErrorMsg {
  type: typeof ORBIT_ERROR;
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
  | OrbitErrorMsg
  | ResetOrbitErrorMsg
  | LoadTableMsg
  | SavingMsg;
