import { keyMap } from '../schema';
import { KeyMap } from '@orbit/data';

export const remoteIdStr = (table: string, localId: string) =>
  (keyMap as KeyMap).idToKey(table, 'remoteId', localId);
export const remoteId = (table: string, localId: string) =>
  parseInt(remoteIdStr(table, localId));
export default remoteId;
