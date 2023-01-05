import { isElectron } from '../api-variable';

export enum LocalKey {
  time = 'lastTime', //datachanges last done
  url = 'fromUrl', //last place specific user was so we can go back there
  deeplink = 'deeplink', //specific path was requested in browser url - we may not know the user.  Do NOT use LocalUserKey with deeplink
  start = 'startNext', //in progress mediadownload
  passage = 'passage',
  compare = 'compare',
}

export const localUserKey = (id: LocalKey) => {
  var userId = '';
  switch (id) {
    case LocalKey.time:
      if (isElectron) userId = 'electron';
      break;
    case LocalKey.deeplink:
      userId = 'DO NOT USE LOCALUSER';
  }
  if (!userId)
    userId =
      localStorage.getItem('user-id') ||
      localStorage.getItem('online-user-id') ||
      '';
  return `${userId}-${id}`;
};
