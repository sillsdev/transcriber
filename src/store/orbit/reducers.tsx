import {
  FETCH_ORBIT_DATA,
  OrbitMsgs,
  IOrbitState,
  ORBIT_ERROR,
  ORBIT_RETRY,
  RESET_ORBIT_ERROR,
  ORBIT_SAVING,
  FETCH_ORBIT_DATA_COMPLETE,
} from './types';

export const orbitCleanState = {
  status: undefined,
  message: '',
  saving: false,
  retry: 0,
  fetchResults: undefined
} as IOrbitState;

export default function (
  state = orbitCleanState,
  action: OrbitMsgs
): IOrbitState {
  switch (action.type) {
    case FETCH_ORBIT_DATA:
      return {
        ...state,
        fetchResults:action.payload,
      };
    case FETCH_ORBIT_DATA_COMPLETE:
        return {
          ...state,
          fetchResults:undefined,
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
