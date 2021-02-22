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
import Coordinator from '@orbit/coordinator';
import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import { DataChange } from '../model/dataChange';
import { API_CONFIG, isElectron } from '../api-variable';
import Auth from '../auth/Auth';
import {
  offlineProjectUpdateSnapshot,
  remoteId,
  remoteIdGuid,
  SetUserLanguage,
} from '../crud';
import { currentDateTime, localUserKey, LocalKey } from '../utils';
import { electronExport } from '../store/importexport/electronExport';
import { useOfflnProjRead } from '../crud/useOfflnProjRead';
import { ExportType, IState, OfflineProject, Plan, VProject } from '../model';
import IndexedDBSource from '@orbit/indexeddb';
import * as actions from '../store';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

interface IStateProps {}

interface IDispatchProps {
  setLanguage: typeof actions.setLanguage;
}

interface IProps extends IStateProps, IDispatchProps {
  auth: Auth;
  children: JSX.Element;
}
const mapStateToProps = (state: IState): IStateProps => ({});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      setLanguage: actions.setLanguage,
    },
    dispatch
  ),
});

export const doDataChanges = async (
  auth: Auth,
  coordinator: Coordinator,
  fingerprint: string,
  projectsLoaded: string[],
  getOfflineProject: (plan: string | Plan | VProject) => OfflineProject,
  errorReporter: any,
  user: string,
  setLanguage: typeof actions.setLanguage
) => {
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  const userLastTimeKey = localUserKey(LocalKey.time, memory);
  let lastTime = localStorage.getItem(userLastTimeKey);
  if (!lastTime) lastTime = currentDateTime(); // should not happen
  let nextTime = currentDateTime();

  const updateSnapshotDates = async () => {
    const oparray: Operation[] = [];

    projectsLoaded.forEach((p) => {
      offlineProjectUpdateSnapshot(p, oparray, memory, nextTime, false);
    });
    await memory.sync(await backup.push((t: TransformBuilder) => oparray));
  };

  const resetRelated = (
    newOps: Operation[],
    tb: TransformBuilder,
    relationship: string,
    upRec: UpdateRecordOperation
  ) => {
    var table = relationship;
    switch (relationship) {
      case 'transcriber':
      case 'editor':
        table = 'user';
    }

    newOps.push(
      tb.replaceRelatedRecord(upRec.record, relationship, {
        type: table,
        id: '',
      })
    );
  };
  var api = API_CONFIG.host + '/api/datachanges/';
  var params;
  if (isElectron) {
    api += 'projects/' + fingerprint;
    var records: { id: string; since: string }[] = [];
    projectsLoaded.forEach((p) => {
      var op = getOfflineProject(p);
      if (op.attributes && op.attributes.snapshotDate)
        records.push({
          id: remoteId('project', p, memory.keyMap),
          since: op.attributes.snapshotDate,
        });
    });
    params = new URLSearchParams([['projlist', JSON.stringify(records)]]);
  } else {
    api += 'since/' + lastTime + '?origin=' + fingerprint;
  }
  try {
    var response = await Axios.get(api, {
      params: params,
      headers: {
        Authorization: 'Bearer ' + auth.accessToken,
      },
    });
    var data = response.data.data as DataChange;
    const changes = data?.attributes?.changes;
    changes.forEach((table) => {
      if (table.ids.length > 0) {
        remote
          .pull((q: QueryBuilder) =>
            q
              .findRecords(table.type)
              .filter({ attribute: 'id-list', value: table.ids.join('|') })
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
                      if (upRec.record.relationships?.transcriber === undefined)
                        resetRelated(newOps, tb, 'transcriber', upRec);

                      if (upRec.record.relationships?.editor === undefined)
                        resetRelated(newOps, tb, 'editor', upRec);

                      break;
                    case 'mediafile':
                      if (upRec.record.relationships?.passage === undefined)
                        resetRelated(newOps, tb, 'passage', upRec);
                      break;
                    case 'user':
                      SetUserLanguage(memory, user, setLanguage);
                      break;
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
      // eslint-disable-next-line no-loop-func
      table.ids.forEach((r) => {
        const localId = remoteIdGuid(table.type, r.toString(), memory.keyMap);
        if (localId) {
          operations.push(tb.removeRecord({ type: table.type, id: localId }));
        }
      });
      if (operations.length > 0) {
        await memory.update(operations);
      }
    }
    localStorage.setItem(userLastTimeKey, nextTime);
    if (isElectron) await updateSnapshotDates();
  } catch (e) {
    logError(Severity.error, errorReporter, e);
  }
};

export function DataChanges(props: IProps) {
  const { auth, children, setLanguage } = props;
  const [isOffline] = useGlobal('offline');
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const [loadComplete] = useGlobal('loadComplete');
  const [busy, setBusy] = useGlobal('remoteBusy');
  const [user] = useGlobal('user');
  const [doSave] = useGlobal('doSave');
  const [fingerprint] = useGlobal('fingerprint');
  const [errorReporter] = useGlobal('errorReporter');
  const [busyDelay, setBusyDelay] = useState<number | null>(null);
  const [dataDelay, setDataDelay] = useState<number | null>(null);
  const [project] = useGlobal('project');
  const [projectsLoaded] = useGlobal('projectsLoaded');
  const getOfflineProject = useOfflnProjRead();

  const defaultBackupDelay = isOffline ? 1000 * 60 * 30 : null; //30 minutes;

  useEffect(() => {
    const defaultBusyDelay = 1000;
    const defaultDataDelay = 1000 * 100;

    if (!remote) setBusy(false);
    setBusyDelay(remote && auth?.isAuthenticated() ? defaultBusyDelay : null);
    setDataDelay(
      loadComplete && remote && auth?.isAuthenticated()
        ? defaultDataDelay
        : null
    );
  }, [remote, auth, loadComplete, setBusy]);

  const updateBusy = () => {
    const checkBusy =
      user === '' || (remote && remote.requestQueue.length !== 0);
    if (checkBusy !== busy) setBusy(checkBusy);
  };
  const updateData = () => {
    if (!busy && !doSave) {
      doDataChanges(
        auth,
        coordinator,
        fingerprint,
        projectsLoaded,
        getOfflineProject,
        errorReporter,
        user,
        setLanguage
      );
    }
  };
  const backupElectron = () => {
    if (!busy && !doSave && project !== '') {
      electronExport(
        ExportType.ITFBACKUP,
        memory,
        undefined,
        project,
        fingerprint,
        user,
        getOfflineProject
      ).catch((err: Error) => {
        logError(
          Severity.error,
          errorReporter,
          infoMsg(err, 'Backup export failed: ')
        );
      });
    }
  };
  useInterval(updateBusy, busyDelay);
  useInterval(updateData, dataDelay);
  useInterval(backupElectron, defaultBackupDelay);
  // render the children component.
  return children;
}
export default connect(mapStateToProps, mapDispatchToProps)(DataChanges) as any;
