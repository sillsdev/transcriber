import {
  FETCH_ORBIT_DATA,
  ORBIT_ERROR,
  ORBIT_RETRY,
  IApiError,
  RESET_ORBIT_ERROR,
  ORBIT_SAVING,
} from './types';
import { Bucket } from '@orbit/core';
import Coordinator from '@orbit/coordinator';
import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import Auth from '../../auth/Auth';
import { Sources } from '../../Sources';
import { Severity } from '../../utils';

export const orbitError = (ex: IApiError) => {
  return ex.response.status !== Severity.retry
    ? {
        type: ORBIT_ERROR,
        payload: ex,
      }
    : {
        type: ORBIT_RETRY,
        payload: ex,
      };
};

export const doOrbitError = (ex: IApiError) => (dispatch: any) => {
  dispatch(orbitError(ex));
};

export const resetOrbitError = () => {
  return {
    type: RESET_ORBIT_ERROR,
  };
};

export const orbitSaving = (val: boolean) => {
  return {
    type: ORBIT_SAVING,
    payload: val,
  };
};

export const fetchOrbitData = (
  coordinator: Coordinator,
  memory: Memory,
  auth: Auth,
  setUser: (id: string) => void,
  setBucket: (bucket: Bucket) => void,
  setRemote: (remote: JSONAPISource) => void,
  setFingerprint: (fingerprint: string) => void,
  setCompleted: (value: number) => void,
  setProjectsLoaded: (value: string[]) => void,
  setCoordinatorActivated: (value: boolean) => void,
  InviteUser: (remote: JSONAPISource, email: string) => Promise<void>,
  setOrbitRetries: (r: number) => void,
  global: any
) => (dispatch: any) => {
  Sources(
    coordinator,
    memory,
    auth,
    setUser,
    setBucket,
    setRemote,
    setFingerprint,
    setCompleted,
    setProjectsLoaded,
    setCoordinatorActivated,
    InviteUser,
    (ex: IApiError) => dispatch(orbitError(ex)),
    setOrbitRetries,
    global
  ).then(dispatch({ type: FETCH_ORBIT_DATA }));
};
