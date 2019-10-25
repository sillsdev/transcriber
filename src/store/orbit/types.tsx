import { Exception } from '@orbit/core';

// Describing the shape of the orbit's slice of state

export interface IApiError extends Exception {
  response: {
    status: number;
  };
}

export interface IOrbitState {
  loaded: boolean;
  status: number;
}

// Describing the different ACTION NAMES available
export const FETCH_ORBIT_DATA = 'FETCH_ORBIT_DATA';
export const ORBIT_ERROR = 'ORBIT_ERROR';
export const RESET_ORBIT_ERROR = 'RESET_ORBIT_ERROR';

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

export type OrbitMsgs = OrbitMsg | OrbitErrorMsg | ResetOrbitErrorMsg;
