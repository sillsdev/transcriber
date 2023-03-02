import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import { QueryBuilder, Transform } from '@orbit/data';
import IndexedDBSource from '@orbit/indexeddb';
import { logError, Severity } from '../utils';
import { waitForLocalId } from '.';

export const pullTableList = async (
  table: string,
  ids: string[],
  memory: Memory,
  remote: JSONAPISource,
  backup: IndexedDBSource,
  errorReporter: any
) => {
  try {
    var t: Transform[] = await remote.pull((q: QueryBuilder) =>
      q
        .findRecords(table)
        .filter({ attribute: 'id-list', value: ids.join('|') })
    );
    for (const tr of t) {
      await memory.sync(await backup.push(tr.operations));
    }
    for (const id of ids) {
      await waitForLocalId(table, id, memory.keyMap);
    }
  } catch (err: any) {
    logError(Severity.error, errorReporter, err.message);
  }
};
