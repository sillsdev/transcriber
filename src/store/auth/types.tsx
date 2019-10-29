// Describing the shape of the book names's slice of state
export interface IAuthState {
  expireAt: number | undefined;
}

// Describing the different ACTION NAMES available
export const SET_EXPIRE = 'SET_EXPIRE';

interface SetExpireMsg {
  type: typeof SET_EXPIRE;
  payload: number;
}

export type AuthMsgs = SetExpireMsg;
