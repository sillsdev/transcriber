import Memory from '@orbit/memory';
import {remoteId} from '../crud';

export enum LocalKey {time='lastTime', url='fromUrl'}

export const localUserKey = (id: LocalKey, memory: Memory) => {
  const userId = localStorage.getItem('user-id') || ''
  const userRemoteId = remoteId('user', userId, memory.keyMap);
  return `${userRemoteId}-${id}`;
}
