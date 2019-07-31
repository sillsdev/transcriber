// Describing the shape of the orbit's slice of state

export interface IOrbitState {
  loaded: boolean;
}

// Describing the different ACTION NAMES available
export const FETCH_ORBIT_DATA = 'FETCH_ORBIT_DATA';

interface OrbitMsg {
  type: typeof FETCH_ORBIT_DATA;
}

export type OrbitMsgs = OrbitMsg;
