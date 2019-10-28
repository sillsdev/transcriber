import {
  FETCH_ORBIT_DATA,
  ORBIT_ERROR,
  IApiError,
  RESET_ORBIT_ERROR,
  LOAD_TABLE,
} from './types';
import { KeyMap, Schema } from '@orbit/data';
import { Bucket } from '@orbit/core';
import Memory from '@orbit/memory';
import Auth from '../../auth/Auth';
import Sources from '../../Sources';
import JSONAPISource from '@orbit/jsonapi';

export const orbitError = (ex: IApiError) => {
  return {
    type: ORBIT_ERROR,
    payload: ex,
  };
};

export const resetOrbitError = () => {
  return {
    type: RESET_ORBIT_ERROR,
  };
};

export const tableLoaded = (name: string) => {
  return {
    type: LOAD_TABLE,
    payload: name,
  };
};

export const fetchOrbitData = (
  schema: Schema,
  memory: Memory,
  keyMap: KeyMap,
  auth: Auth,
  setUser: (id: string) => void,
  setBucket: (bucket: Bucket) => void,
  setRemote: (remote: JSONAPISource) => void,
  setCompleted: (value: number) => void
) => (dispatch: any) => {
  Sources(
    schema,
    memory,
    keyMap,
    auth,
    setUser,
    setBucket,
    setRemote,
    setCompleted,
    (name: string) => dispatch(tableLoaded(name)),
    (ex: IApiError) => dispatch(orbitError(ex))
  ).then(dispatch({ type: FETCH_ORBIT_DATA }));
};
