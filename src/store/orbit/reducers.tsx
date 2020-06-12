import {
  FETCH_ORBIT_DATA,
  OrbitMsgs,
  IOrbitState,
  ORBIT_ERROR,
  ORBIT_RETRY,
  RESET_ORBIT_ERROR,
  ORBIT_SAVING,
} from './types';

export const orbitCleanState = {
  loaded: false,
  status: undefined,
  message: '',
  saving: false,
  retry: 16,
} as IOrbitState;

export default function (
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
      const url: string = response?.url;
      return {
        ...state,
        status: action.payload.response.status,
        message:
          action.payload.message + ' ' + (url ? url.split('/').pop() : ''),
      };
    case ORBIT_RETRY:
      const res2 = action.payload.response as any;
      const url2: string = res2?.url;
      return {
        ...state,
        status: action.payload.response.status,
        message:
          action.payload.message + ' ' + (url2 ? url2.split('/').pop() : ''),
        retry: Math.max(state.retry - 1, 0),
      };
    case RESET_ORBIT_ERROR:
      return {
        ...state,
        status: undefined,
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
