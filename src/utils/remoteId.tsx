import { KeyMap } from '@orbit/data';

export const remoteIdGuid = (table: string, localId: string, keyMap: KeyMap) =>
  (keyMap as KeyMap).keyToId(table, 'remoteId', localId);
export const remoteId = (table: string, localId: string, keyMap: KeyMap) =>
  (keyMap as KeyMap).idToKey(table, 'remoteId', localId);
export const remoteIdNum = (table: string, localId: string, keyMap: KeyMap) =>
  parseInt(remoteId(table, localId, keyMap));
export default remoteIdNum;
