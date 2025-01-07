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
  details: '',
  saving: false,
  retry: 0,
  fetchResults: undefined,
} as IOrbitState;

const OrbitReducers = function (
  state = orbitCleanState,
  action: OrbitMsgs
): IOrbitState {
  switch (action?.type) {
    case FETCH_ORBIT_DATA:
      return {
        ...state,
        fetchResults: action.payload,
      };
    case FETCH_ORBIT_DATA_COMPLETE:
      return {
        ...state,
        fetchResults: undefined,
      };
    case ORBIT_ERROR:
      const response = action.payload.response as any;
      const url: string = response?.url;
      return {
        ...state,
        status: action.payload.response.status,
        message:
          action.payload.message + ' ' + (url ? url.split('/').pop() : ''),
        details: action.payload.stack,
      };
    case ORBIT_RETRY:
      const res2 = action.payload.response as any;
      const url2: string = res2?.url;
      return {
        ...state,
        status: action.payload.response.status,
        message:
          action.payload.message + ' ' + (url2 ? url2.split('/').pop() : ''),
        details: action.payload.stack,
      };
    case RESET_ORBIT_ERROR:
      return {
        ...state,
        status: undefined,
        message: '',
        details: '',
      };
    case ORBIT_SAVING:
      return {
        ...state,
        saving: action.payload,
      };
    default:
      return { ...state };
  }
};

export default OrbitReducers;
