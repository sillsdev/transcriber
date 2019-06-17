import { FETCH_ORBIT_DATA } from './types';
import { KeyMap, Schema } from '@orbit/data';
import Store from '@orbit/store';
import Auth from '../auth/Auth';
import Sources from '../Sources';

export const fetchOrbitData = (
  schema: Schema,
  dataStore: Store,
  keyMap: KeyMap,
  auth: Auth
) => (dispatch: any) => {
  Sources(schema, dataStore, keyMap, auth).then(
    dispatch({ type: FETCH_ORBIT_DATA })
  );
};
