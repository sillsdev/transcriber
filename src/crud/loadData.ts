import {
  offlineProjectCreate,
  offlineProjectFromProject,
  offlineProjectUpdateSnapshot,
  remoteIdGuid,
  remoteIdNum,
} from '.';
import { getDocSerializer } from '../serializers/getSerializer';
import JSONAPISource, {
  JSONAPIDocumentSerializer,
  ResourceDocument,
} from '@orbit/jsonapi';
import IndexedDBSource from '@orbit/indexeddb';
import {
  RecordTransformBuilder,
  RecordOperation,
  RecordIdentity,
  InitializedRecord,
  StandardRecordNormalizer,
  RecordKeyMap,
} from '@orbit/records';
import Memory from '@orbit/memory';
import {
  OrgData,
  IApiError,
  ProjectD,
  GroupMembershipD,
  OrganizationMembershipD,
} from '../model';
import { orbitInfo } from '../utils/infoMsg';
import ProjData from '../model/projData';
import Coordinator from '@orbit/coordinator';
import { getFingerprint, currentDateTime, orbitErr } from '../utils';
import { ReplaceRelatedRecord } from '../model/baseModel';

import PassageType from '../model/passageType';

const completePerTable = 3;

const saveOfflineProject = async (
  project: ProjectD,
  memory: Memory,
  backup: IndexedDBSource,
  dataDate: string | undefined,
  isImport: boolean
) => {
  var oparray: RecordOperation[] = [];
  /* don't update to undefined dataDate from here */
  if (
    !dataDate ||
    !offlineProjectUpdateSnapshot(
      project.id,
      oparray,
      memory,
      dataDate,
      0,
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
  await backup.sync((t) => oparray);
  await memory.sync((t) => oparray);
};

export async function insertData(
  item: InitializedRecord,
  memory: Memory,
  backup: IndexedDBSource,
  tb: RecordTransformBuilder,
  oparray: RecordOperation[],
  orbitError: (ex: IApiError) => void,
  checkExisting: boolean,
  isImport: boolean,
  isProject: boolean,
  snapshotDate?: string
) {
  var rec: InitializedRecord | InitializedRecord[] | null = null;
  var project: ProjectD | undefined = undefined;
  try {
    if (item.keys && checkExisting) {
      var id = remoteIdGuid(
        item.type,
        item.keys['remoteId'],
        memory.keyMap as RecordKeyMap
      );
      rec = memory.cache.query((q) =>
        q.findRecord({ type: item.type, id: id as string })
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
      oparray.push(tb.updateRecord(rec).toOperation());
      if (rec.type === 'project') {
        if (isProject) project = rec as ProjectD;
        await saveOfflineProject(
          rec as ProjectD,
          memory,
          backup,
          isProject ? snapshotDate : undefined,
          isImport && isProject
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
            ...ReplaceRelatedRecord(
              tb,
              rec,
              rel,
              (item.relationships[rel].data as RecordIdentity).type,
              (item.relationships[rel].data as RecordIdentity).id
            )
          );
      }
    } else {
      const rn = new StandardRecordNormalizer({ schema: memory.schema });
      try {
        if (typeof item.id === 'number') item = rn.normalizeRecord(item);
        oparray.push(tb.addRecord(item).toOperation());
        if (item.type === 'project') {
          if (isProject) project = item as ProjectD;
          await saveOfflineProject(
            item as ProjectD,
            memory,
            backup,
            isProject ? snapshotDate : undefined,
            isImport && isProject
          );
        }
      } catch (err: any) {
        orbitError(orbitInfo(err, 'Add record error'));
      }
    }
  }
  return project;
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
  ser: JSONAPIDocumentSerializer,
  memory: Memory,
  backup: IndexedDBSource,
  tb: RecordTransformBuilder,
  setCompleted: undefined | ((valud: number) => void),
  orbitError: (ex: IApiError) => void
) {
  const x = JSON.parse(data);
  const tables: ResourceDocument[] = x.data;
  const oparray: RecordOperation[] = [];
  let completed: number = 15 + start * completePerTable;

  for (let ti = 0; ti < tables.length; ti += 1) {
    const t = tables[ti];
    try {
      let jsonData = ser.deserialize(t).data;
      if (!jsonData) continue;
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
          true, //isProject
          undefined
        );
      }
    } catch (err: any) {
      console.error(err);
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
  var t = new RecordTransformBuilder();
  var ops: RecordOperation[] = [];
  const orgmems: OrganizationMembershipD[] = memory.cache.query((q) =>
    q.findRecords('organizationmembership')
  ) as any;
  const badom = orgmems.filter((om) => !om.attributes);
  badom.forEach((i) => {
    ops.push(
      t.removeRecord({ type: 'organizationmembership', id: i.id }).toOperation()
    );
  });
  const grpmems: GroupMembershipD[] = memory.cache.query((q) =>
    q.findRecords('groupmembership')
  ) as any;
  const badgm = grpmems.filter((om) => !om.attributes);
  badgm.forEach((i) => {
    ops.push(
      t.removeRecord({ type: 'groupmembership', id: i.id }).toOperation()
    );
  });
  await backup.sync((t) => ops);
  await memory.sync((t) => ops);
}
export async function LoadData(
  coordinator: Coordinator,
  setCompleted: (valud: number) => void,
  orbitError: (ex: IApiError) => void
): Promise<boolean> {
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  var tb: RecordTransformBuilder = new RecordTransformBuilder();
  const ser = getDocSerializer(memory);
  //const { checkIt } = usePassageType();

  try {
    let start = 0;
    setCompleted(15);
    do {
      var transform: OrgData[] = (await remote.query(
        // eslint-disable-next-line no-loop-func
        (q) =>
          q.findRecords('orgdata').filter(
            {
              attribute: 'json',
              value: `{version: ${backup.schema.version}}`,
            },
            { attribute: 'start-index', value: start }
          ),
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
      //checkIt();
      var len = (
        memory.cache.query((q) => q.findRecords('passagetype')) as PassageType[]
      ).filter((p) => Boolean(p?.keys?.remoteId)).length;
      if (len > 5) console.log('orgdata passagetype ' + len.toString());
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
  orbitError: (ex: IApiError) => void
): Promise<boolean> {
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  //const { checkIt } = usePassageType();
  if (projectsLoaded.includes(project)) return true;
  if (!remote || !online) throw new Error('offline.');

  const projectid = remoteIdNum(
    'project',
    project,
    memory.keyMap as RecordKeyMap
  );
  var tb: RecordTransformBuilder = new RecordTransformBuilder();
  const ser = getDocSerializer(memory);

  try {
    let start = 0;
    setBusy(true);
    const oparray: RecordOperation[] = [];
    do {
      var transform: ProjData[] = (await remote.query(
        // eslint-disable-next-line no-loop-func
        (q) =>
          q.findRecords('projdata').filter(
            {
              attribute: 'json',
              value: `{version: ${backup.schema.version}}`,
            },
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
        //checkIt();
        var len = (
          memory.cache.query((q) =>
            q.findRecords('passagetype')
          ) as PassageType[]
        ).filter((p) => Boolean(p?.keys?.remoteId)).length;
        if (len > 5) console.log('projdata passagetype ' + len.toString());

        if (start === 0) {
          offlineProjectUpdateSnapshot(
            project,
            oparray,
            memory,
            r.attributes.snapshotdate || currentDateTime(),
            0,
            false
          );
          await backup.sync((t) => oparray);
          await memory.sync((t) => oparray);
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
