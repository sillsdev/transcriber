import Memory from '@orbit/memory';
import { InitializedRecord } from '@orbit/records';

export const findRecord = (memory: Memory, table: string, id: string) => {
  try {
    if ((id ?? '') === '') return undefined;
    return memory?.cache.query((q) =>
      q.findRecord({
        type: table,
        id: id,
      })
    ) as InitializedRecord;
  } catch {
    return undefined;
  }
};
