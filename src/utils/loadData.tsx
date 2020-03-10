import { remoteIdGuid } from '.';
import { isArray } from 'util';
import { JSONAPISerializerCustom } from '../serializers/JSONAPISerializerCustom';
import JSONAPISource, {
  ResourceDocument,
  JSONAPISerializerSettings,
} from '@orbit/jsonapi';
import IndexedDBSource from '@orbit/indexeddb';
import { Record, TransformBuilder, Operation, Transform } from '@orbit/data';
import Memory from '@orbit/memory';
import OrgData from '../model/orgData';
import { Project } from '../model';

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
      //if all inserts don't pass in memory
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

export async function LoadData(
  memory: Memory,
  backup: IndexedDBSource,
  remote: JSONAPISource,
  setCompleted: (valud: number) => void
): Promise<boolean> {
  var tb: TransformBuilder = new TransformBuilder();
  var oparray: Operation[] = [];

  function processData(data: string, ser: JSONAPISerializerCustom) {
    var x = JSON.parse(data);
    var tables: ResourceDocument[] = x.data;
    var completed = 15;
    tables.forEach(t => {
      var json = ser.deserialize(t);
      if (isArray(json.data))
        json.data.forEach(item =>
          insertData(item, memory, tb, oparray, false, false)
        );
      else insertData(json.data, memory, tb, oparray, false, false);
      completed += 3;
      setCompleted(completed);
    });
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
    let transform: Transform[] = await remote.pull(q =>
      q.findRecords('orgdata')
    );
    setCompleted(15);
    if (transform.length > 0 && transform[0].operations.length > 0) {
      var r: OrgData = (transform[0].operations[0] as any).record;
      processData(r.attributes.json, ser);
      try {
        await memory.update(oparray);
        backup.push(oparray);
        return true;
      } catch (err) {
        console.log('backup update err', err);
      }
    }
  } catch (rejected) {
    console.log(rejected);
  }
  return false;
}
