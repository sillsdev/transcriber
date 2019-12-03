import * as type from './types';

export const authCleanState = {
  expireAt: undefined,
} as type.IAuthState;

export default function(
  state = authCleanState,
  action: type.AuthMsgs
): type.IAuthState {
  switch (action.type) {
    case type.SET_EXPIRE:
      return {
        ...state,
        expireAt: action.payload,
      };
    default:
      return state;
  }
}
