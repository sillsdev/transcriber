import { FETCH_ORBIT_DATA } from './types';
import { KeyMap, Schema } from '@orbit/data';
import { Bucket } from '@orbit/core';
import Memory from '@orbit/memory';
import Auth from '../../auth/Auth';
import Sources from '../../Sources';
import JSONAPISource from '@orbit/jsonapi';

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
    setCompleted
  ).then(dispatch({ type: FETCH_ORBIT_DATA }));
};
