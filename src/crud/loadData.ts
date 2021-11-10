import {
  offlineProjectCreate,
  offlineProjectFromProject,
  offlineProjectUpdateSnapshot,
  remoteIdGuid,
  remoteIdNum,
} from '.';
import {
  getSerializer,
  JSONAPISerializerCustom,
} from '../serializers/JSONAPISerializerCustom';
import JSONAPISource, { ResourceDocument } from '@orbit/jsonapi';
import IndexedDBSource from '@orbit/indexeddb';
import {
  Record,
  TransformBuilder,
  Operation,
  QueryBuilder,
  RecordIdentity,
} from '@orbit/data';
import Memory from '@orbit/memory';
import {
  Project,
  OrgData,
  OrganizationMembership,
  GroupMembership,
} from '../model';
import * as actions from '../store';
import { orbitInfo } from '../utils/infoMsg';
import ProjData from '../model/projData';
import Coordinator from '@orbit/coordinator';
import { getFingerprint, currentDateTime, orbitErr } from '../utils';

const completePerTable = 3;

const saveOfflineProject = async (
  project: Project,
  memory: Memory,
  backup: IndexedDBSource,
  dataDate: string | undefined,
  isImport: boolean
) => {
  var oparray: Operation[] = [];
  /* don't update to undefined dataDate from here */
  if (
    !dataDate ||
    !offlineProjectUpdateSnapshot(
      project.id,
      oparray,
      memory,
      dataDate,
      isImport
    )
  ) {
    /* if I have a dataDate, the update above failed for sure
     if I don't have a dataDate, go see if a record already exists */
    if (dataDate || !offlineProjectFromProject(memory, project.id)) {
      var fp = await getFingerprint();
      offlineProjectCreate(
        project,
        oparray,
        memory,
        fp,
        dataDate || '',
        isImport ? dataDate || '' : '',
        isImport
      );
    }
  }
  await memory.sync(await backup.push((t: TransformBuilder) => oparray));
};

export async function insertData(
  item: Record,
  memory: Memory,
  backup: IndexedDBSource,
  tb: TransformBuilder,
  oparray: Operation[],
  orbitError: typeof actions.doOrbitError,
  checkExisting: boolean,
  isImport: boolean,
  snapshotDate?: string
) {
  var rec: Record | Record[] | null = null;
  try {
    if (item.keys && checkExisting) {
      var id = remoteIdGuid(item.type, item.keys['remoteId'], memory.keyMap);
      rec = memory.cache.query((q) =>
        q.findRecord({ type: item.type, id: id })
      );
    }
  } catch (err: any) {
    if (err.constructor.name !== 'RecordNotFoundException') {
      orbitError(orbitInfo(err, item.keys ? item.keys['remoteId'] : ''));
    }
  } finally {
    if (rec) {
      if (Array.isArray(rec)) rec = rec[0]; //won't be...
      rec.attributes = { ...item.attributes };
      oparray.push(tb.updateRecord(rec));
      if (rec.type === 'project') {
        await saveOfflineProject(
          rec as Project,
          memory,
          backup,
          snapshotDate,
          isImport
        );
      }
      for (var rel in item.relationships) {
        if (
          item.relationships[rel].data &&
          !Array.isArray(item.relationships[rel].data) &&
          (!rec.relationships ||
            !rec.relationships[rel] ||
            !rec.relationships[rel].data ||
            (item.relationships[rel].data as RecordIdentity).id !==
              (rec.relationships[rel].data as RecordIdentity).id)
        )
          oparray.push(
            tb.replaceRelatedRecord(
              rec,
              rel,
              item.relationships[rel].data as RecordIdentity
            )
          );
      }
    } else {
      try {
        if (typeof item.id === 'number') memory.schema.initializeRecord(item);
        oparray.push(tb.addRecord(item));
        if (item.type === 'project') {
          await saveOfflineProject(
            item as Project,
            memory,
            backup,
            snapshotDate,
            isImport
          );
        }
      } catch (err: any) {
        orbitError(orbitInfo(err, 'Add record error'));
      }
    }
  }
}
/*
  async function asyncForEach(
    array: any[],
    callback: (arg0: any, arg1: number, arg2: any[]) => any
  ) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }
*/
async function processData(
  start: number,
  data: string,
  ser: JSONAPISerializerCustom,
  memory: Memory,
  backup: IndexedDBSource,
  tb: TransformBuilder,
  setCompleted: undefined | ((valud: number) => void),
  orbitError: typeof actions.doOrbitError
) {
  var x = JSON.parse(data);
  var tables: ResourceDocument[] = x.data;
  var oparray: Operation[] = [];
  var completed: number = 15 + start * completePerTable;

  for (let ti = 0; ti < tables.length; ti += 1) {
    const t = tables[ti];
    try {
      var jsonData = ser.deserialize(t).data;
      if (!Array.isArray(jsonData)) jsonData = [jsonData];
      for (let ji = 0; ji < jsonData.length; ji += 1) {
        const item = jsonData[ji];
        await insertData(
          item,
          memory,
          backup,
          tb,
          oparray,
          orbitError,
          false,
          false,
          undefined
        );
      }
    } catch {
      //ignore it
    }
    completed += completePerTable;
    if (setCompleted && completed < 90) setCompleted(completed);
  }
  try {
    //this was slower than just waiting for them both separately
    //await Promise.all([memory.update(oparray), backup.push(oparray)]);
    var transform = {
      id: 'xyz' + Date.now().toString(),
      operations: oparray,
    };
    await memory
      .sync(transform)
      .then(() => {
        console.log('memory synced');
      })
      .catch((err) => orbitError(orbitInfo(err, 'Sync error')));
    /* don't think we need this because we're doing this after the coordinator now
    ** but if we run into issues with the backup not being complete,
    ** move loadData back up before the coordinator and put this back in
    await backup
      .sync(transform)
      .then((x) => console.log('backup sync complete'))
      .catch((err) => orbitError(orbitInfo(err, 'Backup sync failed'))); */
  } catch (err: any) {
    orbitError(orbitInfo(err, 'Backup update error'));
  }
}
async function cleanUpMemberships(memory: Memory, backup: IndexedDBSource) {
  var t = new TransformBuilder();
  var ops: Operation[] = [];
  const orgmems: OrganizationMembership[] = memory.cache.query(
    (q: QueryBuilder) => q.findRecords('organizationmembership')
  ) as any;
  const badom = orgmems.filter((om) => !om.attributes);
  badom.forEach((i) => {
    ops.push(t.removeRecord({ type: 'organizationmembership', id: i.id }));
  });
  const grpmems: GroupMembership[] = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('groupmembership')
  ) as any;
  const badgm = grpmems.filter((om) => !om.attributes);
  badgm.forEach((i) => {
    ops.push(t.removeRecord({ type: 'groupmembership', id: i.id }));
  });
  await memory.sync(await backup.push(ops));
}
export async function LoadData(
  coordinator: Coordinator,
  setCompleted: (valud: number) => void,
  orbitError: typeof actions.doOrbitError
): Promise<boolean> {
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  var tb: TransformBuilder = new TransformBuilder();
  const ser = getSerializer(memory);

  try {
    let start = 0;
    setCompleted(15);
    do {
      var transform: OrgData[] = (await remote.query(
        // eslint-disable-next-line no-loop-func
        (q: QueryBuilder) =>
          q
            .findRecords('orgdata')
            .filter({ attribute: 'start-index', value: start }),
        {
          label: 'Get Data',
          sources: {
            remote: {
              settings: {
                timeout: 35000,
              },
            },
          },
        }
      )) as any;

      if (transform.length > 0) {
        var r: OrgData = transform[0];
        await processData(
          start,
          r.attributes.json,
          ser,
          memory,
          backup,
          tb,
          setCompleted,
          orbitError
        );
        start = r.attributes.startnext;
      } else {
        //bail - never expect to be here
        start = -1;
      }
    } while (start > -1);
    await cleanUpMemberships(memory, backup);
  } catch (rejected: any) {
    orbitError(orbitErr(rejected, 'load data rejected'));
  }
  return false;
}
export async function LoadProjectData(
  project: string,
  coordinator: Coordinator,
  online: boolean,
  projectsLoaded: string[],
  AddProjectLoaded: (proj: string) => void,
  setBusy: (v: boolean) => void,
  orbitError: typeof actions.doOrbitError
): Promise<boolean> {
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  if (projectsLoaded.includes(project)) return true;
  if (!remote || !online) throw new Error('offline.');

  const projectid = remoteIdNum('project', project, memory.keyMap);
  var tb: TransformBuilder = new TransformBuilder();
  const ser = getSerializer(memory, !online);

  try {
    let start = 0;
    setBusy(true);
    do {
      var transform: ProjData[] = (await remote.query(
        // eslint-disable-next-line no-loop-func
        (q: QueryBuilder) =>
          q
            .findRecords('projdata')
            .filter(
              { attribute: 'start-index', value: start },
              { attribute: 'project-id', value: projectid }
            ),
        {
          label: 'Get Project Data',
          sources: {
            remote: {
              settings: {
                timeout: 35000,
              },
            },
          },
        }
      )) as any;

      if (transform.length > 0) {
        var r: ProjData = transform[0];
        await processData(
          start,
          r.attributes.json,
          ser,
          memory,
          backup,
          tb,
          undefined,
          orbitError
        );
        if (start === 0) {
          var oparray: Operation[] = [];
          offlineProjectUpdateSnapshot(
            project,
            oparray,
            memory,
            r.attributes.snapshotdate || currentDateTime(),
            false
          );
          await memory.sync(await backup.push(oparray));
        }
        start = r.attributes.startnext;
      } else {
        //bail - never expect to be here
        start = -1;
      }
    } while (start > -1);
    setBusy(false);
  } catch (rejected: any) {
    orbitError(orbitErr(rejected, 'load project data rejected'));
    setBusy(false);
    return false;
  }
  AddProjectLoaded(project);
  return true;
}
