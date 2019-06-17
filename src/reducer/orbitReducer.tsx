import { FETCH_ORBIT_DATA } from '../actions/types';

const initialState = {
  loaded: false,
};

export default function(state = initialState, action: any) {
  switch (action.type) {
    case FETCH_ORBIT_DATA:
      return {
        loaded: true,
      };
    default:
      return { ...state };
  }
}
