import { isElectron } from '../api-variable';

export enum LocalKey {
  time = 'lastTime',
  url = 'fromUrl',
  deeplink = 'deeplink',
  start = 'startNext',
}

export const localUserKey = (id: LocalKey) => {
  var userId = '';
  switch (id) {
    case LocalKey.time:
      if (isElectron) userId = 'electron';
      break;
    case LocalKey.deeplink:
      userId = 'any';
  }
  if (!userId) userId = localStorage.getItem('user-id') || '';
  return `${userId}-${id}`;
};
