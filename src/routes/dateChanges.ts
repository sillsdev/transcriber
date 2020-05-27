import Axios from 'axios';
import {
  KeyMap,
  QueryBuilder,
  Transform,
  Schema,
  TransformBuilder,
  Operation,
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
  schema: Schema,
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
          .then((t: Transform[]) => memory.sync(t));
      }
    });
    const deletes = data.attributes.deleted;
    var tb: TransformBuilder = new TransformBuilder();

    for (var ix = 0; ix < deletes.length; ix++) {
      var table = deletes[ix];
      let operations: Operation[] = [];
      table.forEach((r) => {
        const localId = remoteIdGuid(r.type, r.id.toString(), keyMap);
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
