import { useGlobal, useState, useEffect } from 'reactn';
import { infoMsg, logError, Severity } from '../utils';
import { useInterval } from '../utils/useInterval';
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
import { remoteIdGuid, remoteIdNum } from '../crud';
import JSONAPISource, { JSONAPISerializerSettings } from '@orbit/jsonapi';
import { currentDateTime, localUserKey, LocalKey } from '../utils';
import { JSONAPISerializerCustom } from '../serializers/JSONAPISerializerCustom';
import { electronExport } from '../store/importexport/electronExport';

interface IStateProps {}

interface IDispatchProps {}

interface IProps extends IStateProps, IDispatchProps {
  auth: Auth;
  children: JSX.Element;
}

export const doDataChanges = (
  auth: Auth,
  remote: JSONAPISource,
  memory: Memory,
  fingerprint: string,
  errorReporter: any
) => {
  const userLastTimeKey = localUserKey(LocalKey.time, memory);
  let lastTime = localStorage.getItem(userLastTimeKey);
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
  )
    .then(async (response) => {
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
                  if (o.op === 'updateRecord') {
                    var upRec = o as UpdateRecordOperation;
                    switch (upRec.record.type) {
                      case 'section':
                        if (
                          upRec.record.relationships?.transcriber === undefined
                        )
                          newOps.push(
                            tb.replaceRelatedRecord(
                              upRec.record,
                              'transcriber',
                              {
                                type: 'user',
                                id: '',
                              }
                            )
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
      localStorage.setItem(userLastTimeKey, nextTime);
    })
    .catch((e: any) => {
      logError(Severity.error, errorReporter, e);
    });
};

export default function DataChanges(props: IProps) {
  const { auth, children } = props;
  const [isOffline] = useGlobal('offline');
  const [remote] = useGlobal('remote');
  const [busy, setBusy] = useGlobal('remoteBusy');
  const [user] = useGlobal('user');
  const [doSave] = useGlobal('doSave');
  const [fingerprint] = useGlobal('fingerprint');
  const [memory] = useGlobal('memory');
  const [errorReporter] = useGlobal('errorReporter');
  const [busyDelay, setBusyDelay] = useState<number | null>(null);
  const [dataDelay, setDataDelay] = useState<number | null>(null);
  const [project] = useGlobal('project');

  const defaultBackupDelay = isOffline ? 1000 * 60 * 30 : null; //30 minutes;

  useEffect(() => {
    const defaultBusyDelay = 1000;
    const defaultDataDelay = 1000 * 100;

    if (!remote) setBusy(false);
    setBusyDelay(remote && auth?.isAuthenticated() ? defaultBusyDelay : null);
    setDataDelay(remote && auth?.isAuthenticated() ? defaultDataDelay : null);
  }, [remote, auth, setBusy]);

  const updateBusy = () => {
    const checkBusy =
      user === '' || (remote && remote.requestQueue.length !== 0);
    if (checkBusy !== busy) setBusy(checkBusy);
  };
  const updateData = () => {
    if (!busy && !doSave) {
      doDataChanges(auth, remote, memory, fingerprint, errorReporter);
    }
  };
  const backupElectron = () => {
    if (!busy && !doSave && project !== '') {
      const s: JSONAPISerializerSettings = {
        schema: memory.schema,
        keyMap: memory.keyMap,
      };
      const ser = new JSONAPISerializerCustom(s);
      ser.resourceKey = () => {
        return 'remoteId';
      };
      var projectid = remoteIdNum('project', project, memory.keyMap);
      var userid = remoteIdNum('user', user, memory.keyMap);

      electronExport('itfb', memory, projectid, userid, ser).catch(
        (err: Error) => {
          logError(
            Severity.error,
            errorReporter,
            infoMsg(err, 'Backup export failed: ')
          );
        }
      );
    }
  };
  useInterval(updateBusy, busyDelay);
  useInterval(updateData, dataDelay);
  useInterval(backupElectron, defaultBackupDelay);
  // render the children component.
  return children;
}
