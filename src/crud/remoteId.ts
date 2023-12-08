import { RecordKeyMap, InitializedRecord } from '@orbit/records';

export const remoteIdGuid = (
  table: string,
  remoteId: string,
  keyMap: RecordKeyMap
) => keyMap.keyToId(table, 'remoteId', remoteId);
export const remoteId = (
  table: string,
  localId: string,
  keyMap: RecordKeyMap
) => keyMap.idToKey(table, 'remoteId', localId);
export const remoteIdNum = (
  table: string,
  localId: string,
  keyMap: RecordKeyMap
) => parseInt(remoteId(table, localId, keyMap) as string);
export const waitForRemoteId = async (
  rec: InitializedRecord,
  keyMap: RecordKeyMap
): Promise<string> => {
  let maxTries = 5 * 60; // 300 tries for five minutes
  while (maxTries > 0) {
    const val = remoteId(rec.type, rec.id, keyMap);
    if (val !== undefined) return val;
    maxTries -= 1;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('waitForRemoteId: remote id not set');
};
export const waitForLocalId = async (
  table: string,
  remoteId: string,
  keyMap: RecordKeyMap
) => {
  let maxTries = 5 * 60; // 300 tries for five minutes
  while (maxTries > 0) {
    const val = remoteIdGuid(table, remoteId, keyMap);
    if (val !== undefined) return val;
    maxTries -= 1;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('waitForLocalId: record not in keyMap yet');
};
export default remoteIdNum;
