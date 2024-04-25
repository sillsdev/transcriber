import IndexedDBSource from '@orbit/indexeddb';
import JSONAPISource from '@orbit/jsonapi';
import MemorySource from '@orbit/memory';
import { FilterParam, InitializedRecord, RecordIdentity } from '@orbit/records';

interface SyncProps {
  table?: string;
  memory: MemorySource;
}

export interface BackupSyncProps extends SyncProps {
  backup: IndexedDBSource;
}

export const backupToMemory = async ({
  backup,
  table,
  memory,
}: BackupSyncProps) => {
  let tblRecs = (await backup.query((q) =>
    q.findRecords(table)
  )) as InitializedRecord[];
  if (!Array.isArray(tblRecs)) tblRecs = [tblRecs];
  try {
    await memory.sync((t) => tblRecs.map((r) => t.addRecord(r)));
  } catch (e) {
    console.log(table, e);
    throw e;
  }
};

export interface RemoteSyncProps extends SyncProps {
  remote: JSONAPISource;
  filter?: FilterParam<RecordIdentity>[];
}

export const pullRemoteToMemory = async ({
  remote,
  table,
  memory,
  filter,
}: RemoteSyncProps) => {
  let recs = (
    filter
      ? await remote.query((q) => q.findRecords(table).filter(...filter))
      : await remote.query((q) => q.findRecords(table))
  ) as InitializedRecord[];
  if (!Array.isArray(recs)) recs = [recs];
  await memory.sync((t) => recs.map((r) => t.addRecord(r)));
};

export interface RecSyncProps {
  remote: JSONAPISource;
  recId: RecordIdentity;
  memory: MemorySource;
}

export const recToMemory = async ({ recId, remote, memory }: RecSyncProps) => {
  const rec = (await remote.query((q) =>
    q.findRecord(recId)
  )) as InitializedRecord;
  await memory.sync((t) => t.addRecord(rec));
  return rec;
};

interface RemoteBackupSyncProps extends RemoteSyncProps {
  backup: IndexedDBSource;
}

export const remotePullAll = async ({
  remote,
  backup,
  table,
  memory,
  filter,
}: RemoteBackupSyncProps) => {
  let recs = (
    filter
      ? await remote.query((q) => q.findRecords(table).filter(...filter))
      : await remote.query((q) => q.findRecords(table))
  ) as InitializedRecord[];
  if (!Array.isArray(recs)) recs = [recs];
  if (recs.length > 0) {
    await backup.sync((t) => recs.map((r) => t.addRecord(r)));
    await memory.sync((t) => recs.map((r) => t.addRecord(r)));
  }
};
