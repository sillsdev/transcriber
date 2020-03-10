import {
  FETCH_ORBIT_DATA,
  OrbitMsgs,
  IOrbitState,
  ORBIT_ERROR,
  RESET_ORBIT_ERROR,
  ORBIT_SAVING,
} from './types';

export const orbitCleanState = {
  loaded: false,
  status: 0,
  message: '',
  saving: false,
} as IOrbitState;

export default function(
  state = orbitCleanState,
  action: OrbitMsgs
): IOrbitState {
  switch (action.type) {
    case FETCH_ORBIT_DATA:
      return {
        ...state,
        loaded: true,
      };
    case ORBIT_ERROR:
      const response = action.payload.response as any;
      const url: string = response && response.url;
      return {
        ...state,
        status: action.payload.response.status,
        message:
          action.payload.message + ' ' + (url ? url.split('/').pop() : ''),
      };
    case RESET_ORBIT_ERROR:
      return {
        ...state,
        status: 0,
      };
    case ORBIT_SAVING:
      return {
        ...state,
        saving: action.payload,
      };
    default:
      return { ...state };
  }
}
