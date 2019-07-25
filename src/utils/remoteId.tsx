import { KeyMap } from '@orbit/data';

export const remoteIdStr = (table: string, localId: string, keyMap: KeyMap) =>
  (keyMap as KeyMap).keyToId(table, 'remoteId', localId);
export const remoteId = (table: string, localId: string, keyMap: KeyMap) =>
  parseInt(remoteIdStr(table, localId, keyMap));
export default remoteId;
