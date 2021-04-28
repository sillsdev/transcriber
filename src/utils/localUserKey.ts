import Memory from '@orbit/memory';
import { isElectron } from '../api-variable';

export enum LocalKey {
  time = 'lastTime',
  url = 'fromUrl',
  deeplink = 'deeplink',
}

export const localUserKey = (id: LocalKey, memory: Memory) => {
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
