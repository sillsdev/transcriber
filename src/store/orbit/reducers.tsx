import { FETCH_ORBIT_DATA, OrbitMsgs, IOrbitState } from './types';

export const orbitCleanState = {
  loaded: false,
};

export default function(state = orbitCleanState, action: OrbitMsgs): IOrbitState {
  switch (action.type) {
    case FETCH_ORBIT_DATA:
      return {
        loaded: true,
      };
    default:
      return { ...state };
  }
}
