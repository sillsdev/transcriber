import Memory from '@orbit/memory';
import { isElectron } from '../api-variable';

export enum LocalKey {
  time = 'lastTime',
  url = 'fromUrl',
}

export const localUserKey = (id: LocalKey, memory: Memory) => {
  var userId: string;
  if (isElectron && id === LocalKey.time) userId = 'electron';
  else {
    userId = localStorage.getItem('user-id') || '';
  }
  return `${userId}-${id}`;
};
