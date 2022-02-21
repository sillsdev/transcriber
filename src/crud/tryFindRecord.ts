import { QueryBuilder } from '@orbit/data';
import Memory from '@orbit/memory';

export const findRecord = (memory: Memory, table: string, id: string) => {
  try {
    return memory.cache.query((q: QueryBuilder) =>
      q.findRecord({
        type: table,
        id: id,
      })
    );
  } catch {
    return undefined;
  }
};
