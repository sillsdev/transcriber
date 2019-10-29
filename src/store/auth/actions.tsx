import * as type from './types';

export const setExpireAt = (expireAt: number): type.AuthMsgs => {
  return {
    payload: expireAt,
    type: type.SET_EXPIRE,
  };
};
