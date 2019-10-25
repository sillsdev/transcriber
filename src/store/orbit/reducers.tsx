import {
  FETCH_ORBIT_DATA,
  OrbitMsgs,
  IOrbitState,
  ORBIT_ERROR,
  RESET_ORBIT_ERROR,
} from './types';

export const orbitCleanState = {
  loaded: false,
  status: 0,
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
      return {
        ...state,
        status: action.payload.response.status,
      };
    case RESET_ORBIT_ERROR:
      return {
        ...state,
        status: 0,
      };
    default:
      return { ...state };
  }
}
