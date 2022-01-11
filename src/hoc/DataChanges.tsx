import { useGlobal, useState, useEffect, useRef } from 'reactn';
import path from 'path';
import {
  infoMsg,
  logError,
  PathType,
  Severity,
  useCheckOnline,
} from '../utils';
import { useInterval } from '../utils/useInterval';
import Axios from 'axios';
import {
  QueryBuilder,
  Transform,
  TransformBuilder,
  Operation,
  UpdateRecordOperation,
  RecordIdentity,
} from '@orbit/data';
import Coordinator from '@orbit/coordinator';
import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import { DataChange } from '../model/dataChange';
import {
  API_CONFIG,
  isElectron,
  OrbitNetworkErrorRetries,
} from '../api-variable';
import Auth from '../auth/Auth';
import {
  findRecord,
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
import { uploadFile } from '../store';
import { getFileObject } from '../utils/getLocalFile';
import Mediafile, { MediaFile } from '../model/mediaFile';
const os = require('os');
interface IStateProps {}

interface IDispatchProps {
  setLanguage: typeof actions.setLanguage;
  resetOrbitError: typeof actions.resetOrbitError;
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
      resetOrbitError: actions.resetOrbitError,
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
  setLanguage: typeof actions.setLanguage,
  setDataChangeCount: (value: number) => void
) => {
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  const userLastTimeKey = localUserKey(LocalKey.time);
  const userNextStartKey = localUserKey(LocalKey.start);
  if (!remote || !remote.activated) return;
  let startNext = 0;
  let lastTime = localStorage.getItem(userLastTimeKey) || currentDateTime(); // should not happen
  let nextTime = currentDateTime();

  const updateSnapshotDate = async (
    pid: string,
    newDate: string,
    start: number
  ) => {
    const oparray: Operation[] = [];
    offlineProjectUpdateSnapshot(pid, oparray, memory, newDate, start, false);
    await memory.sync(await backup.push((t: TransformBuilder) => oparray));
  };

  const resetRelated = (
    newOps: Operation[],
    tb: TransformBuilder,
    relationship: string,
    record: RecordIdentity
  ) => {
    var table = relationship;
    switch (relationship) {
      case 'transcriber':
      case 'editor':
        table = 'user';
    }

    newOps.push(
      tb.replaceRelatedRecord(record, relationship, {
        type: table,
        id: '',
      })
    );
  };

  const doUpload = (
    f: File,
    m: Mediafile,
    cb: (s: boolean, data: any, status: number, statusText: string) => void
  ) => {
    uploadFile(
      {
        id: m.id,
        audioUrl: m.attributes.audioUrl,
        contentType: m.attributes.contentType,
      },
      f,
      errorReporter,
      auth,
      cb
    );
  };

  const safeURL = (path: string) => {
    if (!path.startsWith('http')) {
      const start = os.platform() === 'win32' ? 8 : 7;
      const url = new URL(`file://${path}`).toString().slice(start);
      return `transcribe-safe://${url}`;
    }
    return path;
  };

  const DeleteLocalCopy = (
    offlineId: string | null,
    type: string,
    tb: TransformBuilder,
    localOps: Operation[]
  ) => {
    if (offlineId) {
      var myRecord = findRecord(memory, type, offlineId);
      if (myRecord) {
        localOps.push(
          tb.removeRecord({
            type: type,
            id: offlineId,
          })
        );
      }
    }
  };

  const CheckUploadLocal = async (upRec: any) => {
    var myRecord = findRecord(
      memory,
      upRec.record.type,
      upRec.record.attributes?.offlineId
    ) as MediaFile;
    if (myRecord) {
      var curpath = path.join(
        os.homedir(),
        process.env.REACT_APP_OFFLINEDATA || '',
        PathType.MEDIA,
        upRec.record.attributes?.originalFile
      );
      var url = safeURL(curpath);
      getFileObject(
        url,
        myRecord.attributes.originalFile,
        myRecord.attributes.contentType,
        // eslint-disable-next-line no-loop-func
        function (f: File) {
          doUpload(
            f,
            upRec.record as Mediafile,
            async function (
              success: boolean,
              data: any,
              status: number,
              statusText: string
            ) {
              if (success) {
                var delOps: Operation[] = [];
                console.log('success!', data);
                DeleteLocalCopy(
                  upRec.record.attributes?.offlineId,
                  upRec.record.type,
                  new TransformBuilder(),
                  delOps
                );
                if (delOps.length > 0) memory.sync(await backup.push(delOps));
              } else {
                //what to do here???
                console.log(status, statusText);
              }
            }
          );
        }
      );
    }
  };

  const processDataChanges = async (
    api: string,
    params: any,
    started: number
  ) => {
    try {
      var response = await Axios.get(api, {
        params: params,
        headers: {
          Authorization: 'Bearer ' + auth.accessToken,
        },
      });
      var data = response.data.data as DataChange;
      const changes = data?.attributes?.changes;
      const deletes = data?.attributes?.deleted;
      setDataChangeCount(changes.length + deletes.length);
      for (const table of changes) {
        if (table.ids.length > 0) {
          remote
            .pull((q: QueryBuilder) =>
              q
                .findRecords(table.type)
                .filter({ attribute: 'id-list', value: table.ids.join('|') })
            )
            .then(async (t: Transform[]) => {
              for (const tr of t) {
                var tb = new TransformBuilder();
                var localOps: Operation[] = [];
                var newOps: Operation[] = [];
                var upRec: UpdateRecordOperation;
                //await UpdateOfflineIds(tr.operations, tb, newOps);
                await memory.sync(await backup.push(tr.operations));
                for (const o of tr.operations) {
                  if (o.op === 'updateRecord') {
                    upRec = o as UpdateRecordOperation;
                    switch (upRec.record.type) {
                      case 'section':
                        if (
                          upRec.record.relationships?.transcriber === undefined
                        )
                          resetRelated(
                            localOps,
                            tb,
                            'transcriber',
                            upRec.record
                          );
                        if (upRec.record.relationships?.editor === undefined)
                          resetRelated(localOps, tb, 'editor', upRec.record);
                        break;

                      case 'mediafile':
                        await CheckUploadLocal(upRec);
                        if (upRec.record.relationships?.passage === undefined)
                          resetRelated(localOps, tb, 'passage', upRec.record);
                        break;

                      case 'user':
                        SetUserLanguage(memory, user, setLanguage);
                        break;

                      case 'discussion':
                      case 'comment':
                        DeleteLocalCopy(
                          upRec.record.attributes?.offlineId,
                          upRec.record.type,
                          tb,
                          localOps
                        );
                    }
                  }
                }
                if (localOps.length > 0)
                  memory.sync(await backup.push(localOps));
                if (newOps.length > 0) memory.update(newOps);
              }
            });
        }
      }
      setDataChangeCount(deletes.length);
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
          await memory.sync(await backup.push(operations));
        }
      }
      setDataChangeCount(0);
      return data?.attributes?.startnext;
    } catch (e: any) {
      logError(Severity.error, errorReporter, e);
      return started;
    }
  };
  var version = backup.cache.dbVersion;

  var api = API_CONFIG.host + '/api/datachanges/v' + version.toString() + '/';
  var start = 1;
  var tries = 5;
  if (isElectron) {
    for (var ix = 0; ix < projectsLoaded.length; ix++) {
      var p = projectsLoaded[ix];
      var op = getOfflineProject(p);
      if (
        op?.attributes &&
        op.attributes.snapshotDate &&
        Date.parse(op.attributes.snapshotDate) < Date.parse(lastTime)
      ) {
        start = 1;
        startNext = 0;
        tries = 5;
        while (startNext >= 0 && tries > 0) {
          startNext = await processDataChanges(
            `${api}${startNext}/project/${fingerprint}`,
            new URLSearchParams([
              [
                'projlist',
                JSON.stringify({
                  id: remoteId('project', p, memory.keyMap),
                  since: op.attributes.snapshotDate,
                }),
              ],
            ]),
            start
          );
          if (startNext === start) tries--;
          else start = startNext;
        }
        await updateSnapshotDate(p, nextTime, startNext + 1);
      }
    }
  }
  startNext = parseInt(localStorage.getItem(userNextStartKey) || '0', 10);
  start = 1;
  tries = 5;
  while (startNext >= 0 && tries > 0) {
    startNext = await processDataChanges(
      `${api}${startNext}/since/${lastTime}?origin=${fingerprint}`,
      undefined,
      start
    );
    if (startNext === start) tries--;
    else start = startNext;
  }
  if (startNext < 0) localStorage.setItem(userLastTimeKey, nextTime);
  localStorage.setItem(userNextStartKey, (startNext + 1).toString());
};

export function DataChanges(props: IProps) {
  const { auth, children, setLanguage, resetOrbitError } = props;
  const [isOffline] = useGlobal('offline');
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const [loadComplete] = useGlobal('loadComplete');
  const [busy, setBusy] = useGlobal('remoteBusy');
  const [, setDataChangeCount] = useGlobal('dataChangeCount');
  const [connected] = useGlobal('connected');
  const [user] = useGlobal('user');
  const [doSave] = useGlobal('doSave');
  const [fingerprint] = useGlobal('fingerprint');
  const [errorReporter] = useGlobal('errorReporter');
  const [busyDelay, setBusyDelay] = useState<number | null>(null);
  const [dataDelay, setDataDelay] = useState<number | null>(null);
  const [firstRun, setFirstRun] = useState(true);
  const [project] = useGlobal('project');
  const [projectsLoaded] = useGlobal('projectsLoaded');
  const [orbitRetries] = useGlobal('orbitRetries');
  const doingChanges = useRef(false);
  const getOfflineProject = useOfflnProjRead();
  const checkOnline = useCheckOnline(resetOrbitError);

  const defaultBackupDelay = isOffline ? 1000 * 60 * 30 : null; //30 minutes;

  useEffect(() => {
    const defaultBusyDelay = 1000;
    const defaultDataDelay = 1000 * 100;

    setFirstRun(dataDelay === null);
    var newDelay =
      connected && loadComplete && remote && auth?.isAuthenticated()
        ? dataDelay === null
          ? 10
          : defaultDataDelay
        : null;
    setDataDelay(newDelay);
    if (!remote) setBusy(false);
    setBusyDelay(
      remote && auth?.isAuthenticated()
        ? defaultBusyDelay * (connected ? 1 : 10)
        : null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote, auth, loadComplete, connected, firstRun]);
  const updateBusy = () => {
    const checkBusy =
      user === '' || (remote && remote.requestQueue.length !== 0);
    //we know we're offline, or we've retried something so maybe we're offline
    if (!connected || (checkBusy && orbitRetries < OrbitNetworkErrorRetries)) {
      checkOnline((result) => {
        if ((checkBusy && result) !== busy) setBusy(checkBusy && result);
      });
    } else if (checkBusy !== busy) setBusy(checkBusy);
  };
  const updateData = async () => {
    if (!doingChanges.current && !busy && !doSave && auth?.isAuthenticated()) {
      doingChanges.current = true; //attempt to prevent double calls
      setFirstRun(false);
      await doDataChanges(
        auth,
        coordinator,
        fingerprint,
        projectsLoaded,
        getOfflineProject,
        errorReporter,
        user,
        setLanguage,
        setDataChangeCount
      );
      doingChanges.current = false; //attempt to prevent double calls
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
