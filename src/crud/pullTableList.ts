import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import { RecordKeyMap } from '@orbit/records';
import IndexedDBSource from '@orbit/indexeddb';
import { logError, Severity } from '../utils';
import { waitForLocalId } from '.';
import { remotePullAll } from './syncToMemory';

export const pullTableList = async (
  table: string,
  ids: string[],
  memory: Memory,
  remote: JSONAPISource,
  backup: IndexedDBSource,
  errorReporter: any
) => {
  try {
    if (ids.length === 0) return;
    const filter = [{ attribute: 'id-list', value: ids.join('|') }];
    await remotePullAll({ table, memory, remote, backup, filter });
    for (const id of ids) {
      await waitForLocalId(table, id, memory?.keyMap as RecordKeyMap);
    }
  } catch (err: any) {
    logError(Severity.error, errorReporter, err.message);
  }
};
