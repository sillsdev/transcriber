import Memory from '@orbit/memory';
import { isElectron } from '../api-variable';
import { remoteId } from '../crud';

export enum LocalKey {
  time = 'lastTime',
  url = 'fromUrl',
}

export const localUserKey = (id: LocalKey, memory: Memory) => {
  var userRemoteId: string;
  if (isElectron && id === LocalKey.time) userRemoteId = 'electron';
  else {
    const userId = localStorage.getItem('user-id') || '';
    userRemoteId = userId; // remoteId('user', userId, memory.keyMap) || userId;
  }
  return `${userRemoteId}-${id}`;
};
