import { remoteIdGuid } from '.';
import { isArray } from 'util';
import { JSONAPISerializerCustom } from '../serializers/JSONAPISerializerCustom';
import JSONAPISource, {
  ResourceDocument,
  JSONAPISerializerSettings,
} from '@orbit/jsonapi';
import IndexedDBSource from '@orbit/indexeddb';
import { Record, TransformBuilder, Operation, QueryBuilder } from '@orbit/data';
import Memory from '@orbit/memory';
import OrgData from '../model/orgData';
import { Project } from '../model';

const completePerTable = 3;

export function insertData(
  item: Record,
  memory: Memory,
  tb: TransformBuilder,
  oparray: Operation[],
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
      rec = memory.cache.query(q => q.findRecord({ type: item.type, id: id }));
    }
  } catch (err) {
    if (err.constructor.name !== 'RecordNotFoundException') console.log(err);
  } finally {
    if (rec) {
      if (isArray(rec)) rec = rec[0]; //won't be...
      item.id = rec.id;
      oparray.push(tb.updateRecord(item));
    } else {
      try {
        memory.schema.initializeRecord(item);
        oparray.push(tb.addRecord(item));
      } catch (err) {
        console.log(err);
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
export async function LoadData(
  memory: Memory,
  backup: IndexedDBSource,
  remote: JSONAPISource,
  setCompleted: (valud: number) => void
): Promise<boolean> {
  var tb: TransformBuilder = new TransformBuilder();

  async function processData(
    start: number,
    data: string,
    ser: JSONAPISerializerCustom
  ) {
    var x = JSON.parse(data);
    var tables: ResourceDocument[] = x.data;
    var oparray: Operation[] = [];
    var completed: number = 15 + start * completePerTable;

    tables.forEach(t => {
      var json = ser.deserialize(t);
      if (isArray(json.data)) {
        //console.log(json.data[0].type, json.data.length);
        json.data.forEach(item =>
          insertData(item, memory, tb, oparray, false, false)
        );
      } else {
        insertData(json.data, memory, tb, oparray, false, false);
      }
      completed += completePerTable;
      setCompleted(completed);
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
        .then(() => console.log('memory synced'))
        .catch(err => {
          console.log(err);
        });
      await backup
        .sync(transform)
        .then(x => console.log('backup sync complete'))
        .catch(err => console.log('backup sync failed', err));
    } catch (err) {
      console.log('backup update err', err);
    }
  }

  const s: JSONAPISerializerSettings = {
    schema: memory.schema,
    keyMap: memory.keyMap,
  };
  const ser = new JSONAPISerializerCustom(s);
  ser.resourceKey = () => {
    return 'remoteId';
  };

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
              timeout: 35000,
            },
          },
        }
      )) as any;

      if (transform.length > 0) {
        var r: OrgData = transform[0];
        await processData(start, r.attributes.json, ser);
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
