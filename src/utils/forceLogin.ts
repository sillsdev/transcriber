import { LocalKey } from './localUserKey';

export function forceLogin() {
  localStorage.removeItem(LocalKey.authId);
  localStorage.removeItem(LocalKey.userId);
}
