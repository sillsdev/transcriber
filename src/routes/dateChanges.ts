import Axios from 'axios';
import {
  KeyMap,
  QueryBuilder,
  Transform,
  RemoveRecordOperation,
  Schema,
} from '@orbit/data';
import Memory from '@orbit/memory';
import { DataChange } from '../model/dataChange';
import { API_CONFIG } from '../api-variable';
import Auth from '../auth/Auth';
import { remoteIdGuid } from '../utils';
import JSONAPISource from '@orbit/jsonapi';
import { currentDateTime } from '../utils/currentDateTime';

export const dateChanges = (
  auth: Auth,
  keyMap: KeyMap,
  remote: JSONAPISource,
  memory: Memory,
  schema: Schema
) => {
  let lastTime = localStorage.getItem('lastTime');
  if (!lastTime) lastTime = currentDateTime(); // should not happen
  let nextTime = currentDateTime();
  Axios.get(
    API_CONFIG.host +
      '/api/datachanges/since/' +
      lastTime +
      '?origin=' +
      window.location.origin,
    {
      headers: {
        Authorization: 'Bearer ' + auth.accessToken,
      },
    }
  ).then(response => {
    const data = response.data.data as DataChange;
    const changes = data.attributes.changes;
    changes.forEach(table => {
      const localRecIds = table.map(r => {
        let localId = remoteIdGuid(r.type, r.id.toString(), keyMap);
        if (!localId) {
          const rec = { type: r.type, keys: { remoteId: r.id } } as any;
          schema.initializeRecord(rec);
          keyMap.pushRecord(rec);
          localId = rec.id;
        }
        return {
          type: r.type,
          id: localId,
        };
      });
      // pulling an Array from JsonApi fails and throws an error
      // remote
      //   .pull((q: QueryBuilder) => q.findRecords(localRecIds))
      //   .then((t: Transform[]) => memory.sync(t));
      localRecIds.forEach(r => {
        if (r.id) {
          remote
            .pull((q: QueryBuilder) => q.findRecord(r))
            .then((t: Transform[]) => memory.sync(t));
        }
      });
    });
    const deletes = data.attributes.deleted;
    deletes.forEach(table => {
      let operations: RemoveRecordOperation[] = [];
      table.forEach(r => {
        const localId = remoteIdGuid(r.type, r.id.toString(), keyMap);
        if (localId) {
          operations.push({
            op: 'removeRecord',
            record: {
              type: r.type,
              id: localId,
            },
          });
        }
      });
      if (operations.length > 0) {
        memory.sync({ id: 'delete-changes', operations });
      }
    });
    localStorage.setItem('lastTime', nextTime);
  });
};
