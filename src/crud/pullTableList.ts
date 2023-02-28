import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import { QueryBuilder, Transform } from '@orbit/data';
import IndexedDBSource from '@orbit/indexeddb';
import { logError, Severity } from '../utils';

export const pullTableList = async (
  table: string,
  ids: string[],
  memory: Memory,
  remote: JSONAPISource,
  backup: IndexedDBSource,
  errorReporter: any
) => {
  remote
    .pull((q: QueryBuilder) =>
      q
        .findRecords(table)
        .filter({ attribute: 'id-list', value: ids.join('|') })
    )
    .then(async (t: Transform[]) => {
      for (const tr of t) {
        await memory.sync(await backup.push(tr.operations));
      }
    })
    .catch((err: Error) => {
      logError(Severity.error, errorReporter, err.message);
    });
};
