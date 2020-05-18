import {
  FETCH_ORBIT_DATA,
  ORBIT_ERROR,
  IApiError,
  RESET_ORBIT_ERROR,
  ORBIT_SAVING,
} from './types';
import { KeyMap, Schema } from '@orbit/data';
import { Bucket } from '@orbit/core';
import Memory from '@orbit/memory';
import Auth from '../../auth/Auth';
import { Sources } from '../../Sources';
import JSONAPISource from '@orbit/jsonapi';
import IndexedDBSource from '@orbit/indexeddb';

export const orbitError = (ex: IApiError) => {
  return {
    type: ORBIT_ERROR,
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
  schema: Schema,
  memory: Memory,
  keyMap: KeyMap,
  backup: IndexedDBSource,
  auth: Auth,
  offline: boolean,
  setUser: (id: string) => void,
  setBucket: (bucket: Bucket) => void,
  setRemote: (remote: JSONAPISource) => void,
  setCompleted: (value: number) => void,
  setProjectsLoaded: (value: string[]) => void,
  setCoordinatorActivated: (value: boolean) => void,
  InviteUser: (remote: JSONAPISource, email: string) => Promise<void>
) => (dispatch: any) => {
  Sources(
    schema,
    memory,
    keyMap,
    backup,
    auth,
    offline,
    setUser,
    setBucket,
    setRemote,
    setCompleted,
    setProjectsLoaded,
    setCoordinatorActivated,
    InviteUser,
    (ex: IApiError) => dispatch(orbitError(ex))
  ).then(dispatch({ type: FETCH_ORBIT_DATA }));
};
