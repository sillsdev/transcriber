import {
  FETCH_ORBIT_DATA,
  ORBIT_ERROR,
  ORBIT_RETRY,
  IApiError,
  RESET_ORBIT_ERROR,
  ORBIT_SAVING,
  FETCH_ORBIT_DATA_COMPLETE,
} from './types';
import { Bucket } from '@orbit/core';
import Coordinator from '@orbit/coordinator';
import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import Auth from '../../auth/Auth';
import { Sources } from '../../Sources';
import { Severity } from '../../utils';
import { OfflineProject, Plan, VProject } from '../../model';

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

export const orbitComplete = () => (dispatch: any) => {
  dispatch( {
    type: FETCH_ORBIT_DATA_COMPLETE,
  });
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
  fingerprint: string,
  setUser: (id: string) => void,
  setBucket: (bucket: Bucket) => void,
  setRemote: (remote: JSONAPISource) => void,
  setProjectsLoaded: (value: string[]) => void,
  setCoordinatorActivated: (value: boolean) => void,
  setOrbitRetries: (r: number) => void,
  global: any,
  getOfflineProject: (plan: Plan | VProject | string) => OfflineProject,
) => (dispatch: any) => {
 Sources(
    coordinator,
    memory,
    auth,
    fingerprint,
    setUser,
    setBucket,
    setRemote,
    setProjectsLoaded,
    setCoordinatorActivated,
    (ex: IApiError) => dispatch(orbitError(ex)),
    setOrbitRetries,
    global,
    getOfflineProject,
  ).then((fr) => {
      dispatch({ type: FETCH_ORBIT_DATA, payload: fr})
    });
};
