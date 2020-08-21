import Axios from 'axios';
import {
  QueryBuilder,
  Transform,
  TransformBuilder,
  Operation,
  UpdateRecordOperation,
} from '@orbit/data';
import Memory from '@orbit/memory';
import { DataChange } from '../model/dataChange';
import { API_CONFIG } from '../api-variable';
import Auth from '../auth/Auth';
import { remoteIdGuid } from '../crud';
import JSONAPISource from '@orbit/jsonapi';
import { currentDateTime } from '../utils';

export const dateChanges = (
  auth: Auth,
  remote: JSONAPISource,
  memory: Memory,
  fingerprint: string
) => {
  let lastTime = localStorage.getItem('lastTime');
  if (!lastTime) lastTime = currentDateTime(); // should not happen
  let nextTime = currentDateTime();
  Axios.get(
    API_CONFIG.host +
      '/api/datachanges/since/' +
      lastTime +
      '?origin=' +
      fingerprint,
    {
      headers: {
        Authorization: 'Bearer ' + auth.accessToken,
      },
    }
  ).then(async (response) => {
    const data = response.data.data as DataChange;
    const changes = data.attributes.changes;
    changes.forEach((table) => {
      if (table.length > 0) {
        const list = table.map((t) => t.id);
        remote
          .pull((q: QueryBuilder) =>
            q
              .findRecords(table[0].type)
              .filter({ attribute: 'id-list', value: list.join('|') })
          )
          .then((t: Transform[]) => {
            memory.sync(t);
            t.forEach((tr) => {
              var tb = new TransformBuilder();
              var newOps: Operation[] = [];
              tr.operations.forEach((o) => {
                if ((o.op = 'updateRecord')) {
                  var upRec = o as UpdateRecordOperation;
                  switch (upRec.record.type) {
                    case 'section':
                      if (upRec.record.relationships?.transcriber === undefined)
                        newOps.push(
                          tb.replaceRelatedRecord(upRec.record, 'transcriber', {
                            type: 'user',
                            id: '',
                          })
                        );
                      if (upRec.record.relationships?.editor === undefined)
                        newOps.push(
                          tb.replaceRelatedRecord(upRec.record, 'editor', {
                            type: 'user',
                            id: '',
                          })
                        );
                      break;
                    case 'mediafile':
                      if (upRec.record.relationships?.passage === undefined)
                        newOps.push(
                          tb.replaceRelatedRecord(upRec.record, 'passage', {
                            type: 'passage',
                            id: '',
                          })
                        );
                  }
                }
              });
              if (newOps.length > 0) memory.update(() => newOps);
            });
          });
      }
    });
    const deletes = data.attributes.deleted;
    var tb: TransformBuilder = new TransformBuilder();

    for (var ix = 0; ix < deletes.length; ix++) {
      var table = deletes[ix];
      let operations: Operation[] = [];
      table.forEach((r) => {
        const localId = remoteIdGuid(r.type, r.id.toString(), memory.keyMap);
        if (localId) {
          operations.push(tb.removeRecord({ type: r.type, id: localId }));
        }
      });
      if (operations.length > 0) {
        await memory.update(operations);
      }
    }
    localStorage.setItem('lastTime', nextTime);
  });
};
