import { FETCH_ORBIT_DATA } from './types';
import { KeyMap, Schema } from '@orbit/data';
import Store from '@orbit/store';
import Auth from '../auth/Auth';
import Sources from '../Sources';

export const fetchOrbitData = (
  schema: Schema,
  dataStore: Store,
  keyMap: KeyMap,
  auth: Auth,
  setUser: (id: string) => void,
  setCompleted: (value: number) => void
) => (dispatch: any) => {
  Sources(schema, dataStore, keyMap, auth, setUser, setCompleted).then(
    dispatch({ type: FETCH_ORBIT_DATA })
  );
};
