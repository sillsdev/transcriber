import { remoteIdGuid, remoteIdNum } from '.';
import { isArray } from 'util';
import { JSONAPISerializerCustom } from '../serializers/JSONAPISerializerCustom';
import JSONAPISource, {
  ResourceDocument,
  JSONAPISerializerSettings,
} from '@orbit/jsonapi';
import IndexedDBSource from '@orbit/indexeddb';
import {
  Record,
  TransformBuilder,
  Operation,
  QueryBuilder,
  RecordIdentity,
} from '@orbit/data';
import Memory from '@orbit/memory';
import OrgData from '../model/orgData';
import { Project, IApiError } from '../model';
import { orbitInfo } from './infoMsg';
import ProjData from '../model/projData';

const completePerTable = 3;

export function insertData(
  item: Record,
  memory: Memory,
  tb: TransformBuilder,
  oparray: Operation[],
  orbitError: (ex: IApiError) => void,
  checkExisting: boolean,
  isImport: boolean
) {
  if (isImport && item.type === 'project') {
    var project = item as Project;
    project.attributes.dateImported = project.attributes.dateExported;
    project.attributes.dateExported = null;
  }
  var rec: Record | Record[] | null = null;
  try {
    if (item.keys && checkExisting) {
      var id = remoteIdGuid(item.type, item.keys['remoteId'], memory.keyMap);
      rec = memory.cache.query((q) =>
        q.findRecord({ type: item.type, id: id })
      );
    }
  } catch (err) {
    if (err.constructor.name !== 'RecordNotFoundException') {
      orbitError(orbitInfo(err, item.keys ? item.keys['remoteId'] : ''));
    }
  } finally {
    if (rec) {
      if (isArray(rec)) rec = rec[0]; //won't be...
      rec.attributes = { ...item.attributes };
      oparray.push(tb.updateRecord(rec));
      for (var rel in item.relationships) {
        if (
          item.relationships[rel].data &&
          !isArray(item.relationships[rel].data) &&
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
        memory.schema.initializeRecord(item);
        oparray.push(tb.addRecord(item));
      } catch (err) {
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
  _backup: IndexedDBSource,
  tb: TransformBuilder,
  setCompleted: undefined | ((valud: number) => void),
  orbitError: (ex: IApiError) => void
) {
  var x = JSON.parse(data);
  var tables: ResourceDocument[] = x.data;
  var oparray: Operation[] = [];
  var completed: number = 15 + start * completePerTable;

  tables.forEach((t) => {
    var json = ser.deserialize(t);
    if (isArray(json.data)) {
      json.data.forEach((item) =>
        insertData(item, memory, tb, oparray, orbitError, false, false)
      );
    } else {
      insertData(json.data, memory, tb, oparray, orbitError, false, false);
    }
    completed += completePerTable;
    if (setCompleted) setCompleted(completed);
  });
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
  } catch (err) {
    orbitError(orbitInfo(err, 'Backup update error'));
  }
}

function GetSerializer(memory: Memory) {
  const s: JSONAPISerializerSettings = {
    schema: memory.schema,
    keyMap: memory.keyMap,
  };
  const ser = new JSONAPISerializerCustom(s);
  ser.resourceKey = () => {
    return 'remoteId';
  };
  return ser;
}

export async function LoadData(
  memory: Memory,
  backup: IndexedDBSource,
  remote: JSONAPISource,
  setCompleted: (valud: number) => void,
  orbitError: (ex: IApiError) => void
): Promise<boolean> {
  var tb: TransformBuilder = new TransformBuilder();
  const ser = GetSerializer(memory);

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
  } catch (rejected) {
    console.log(rejected);
  }
  return false;
}
export async function LoadProjectData(
  project: string,
  memory: Memory,
  remote: JSONAPISource,
  online: boolean,
  backup: IndexedDBSource,
  projectsLoaded: string[],
  setProjectsLoaded: (valud: string[]) => void,
  orbitError: (ex: IApiError) => void
): Promise<boolean> {
  if (projectsLoaded.includes(project)) return true;
  if (!remote || !online) throw new Error('offline.');

  const projectid = remoteIdNum('project', project, memory.keyMap);
  var tb: TransformBuilder = new TransformBuilder();
  const ser = GetSerializer(memory);

  try {
    let start = 0;
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
        start = r.attributes.startnext;
      } else {
        //bail - never expect to be here
        start = -1;
      }
    } while (start > -1);
  } catch (rejected) {
    console.log(rejected);
    return false;
  }
  AddProjectLoaded(project, projectsLoaded, setProjectsLoaded);
  return true;
}

export function AddProjectLoaded(
  project: string,
  projectsLoaded: string[],
  setProjectsLoaded: (valud: string[]) => void
) {
  if (projectsLoaded.includes(project)) return;
  var pl = [...projectsLoaded];
  pl.push(project);
  setProjectsLoaded(pl);
}
