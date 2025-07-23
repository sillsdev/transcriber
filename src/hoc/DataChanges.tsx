import {
  useState,
  useEffect,
  useRef,
  useContext,
  useMemo,
  PropsWithChildren,
  useCallback,
} from 'react';
import { useGetGlobal, useGlobal } from '../context/GlobalContext';
import { infoMsg, logError, Severity, useCheckOnline } from '../utils';
import { useInterval } from '../utils/useInterval';
import {
  RecordTransform,
  RecordTransformBuilder,
  RecordOperation,
  UpdateRecordOperation,
  RecordIdentity,
  RecordKeyMap,
} from '@orbit/records';
import Coordinator from '@orbit/coordinator';
import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import { DataChange } from '../model/dataChange';
import {
  API_CONFIG,
  isElectron,
  OrbitNetworkErrorRetries,
} from '../api-variable';
import {
  AcceptInvitation,
  findRecord,
  GetUser,
  IFetchNowProps,
  offlineProjectUpdateSnapshot,
  related,
  remoteId,
  remoteIdGuid,
  remoteIdNum,
  SetUserLanguage,
  useFetchUrlNow,
} from '../crud';
import { currentDateTime, localUserKey, LocalKey } from '../utils';
import { electronExport } from '../store/importexport/electronExport';
import { useOfflnProjRead } from '../crud/useOfflnProjRead';
import {
  ExportType,
  Invitation,
  InvitationD,
  MediaFileD,
  OfflineProject,
  PassageStateChangeD,
  Plan,
  UserD,
  VProject,
} from '../model';
import IndexedDBSource from '@orbit/indexeddb';
import * as actions from '../store';
import { TokenContext } from '../context/TokenProvider';
import { UnsavedContext } from '../context/UnsavedContext';
import { ReplaceRelatedRecord } from '../model/baseModel';
import { useSanityCheck } from '../crud/useSanityCheck';
import { useBibleMedia } from '../crud/useBibleMedia';
import { useDispatch } from 'react-redux';
import { pullRemoteToMemory } from '../crud/syncToMemory';
import { useOrbitData } from './useOrbitData';
import { axiosGet } from '../utils/axios';

export const processDataChanges = async (pdc: {
  token: string | null;
  api: string;
  params: any;
  started: number;
  coordinator: Coordinator;
  user: string;
  errorReporter: any;
  setLanguage: typeof actions.setLanguage;
  setDataChangeCount: (value: number) => void;
  fetchUrl?: (props: IFetchNowProps) => Promise<string | undefined>;
  cb?: () => void;
}) => {
  const {
    token,
    api,
    params,
    started,
    coordinator,
    user,
    errorReporter,
    setLanguage,
    setDataChangeCount,
    fetchUrl,
    cb,
  } = pdc;

  const memory = coordinator?.getSource('memory') as Memory;
  const remote = coordinator?.getSource('datachanges') as JSONAPISource;
  const backup = coordinator?.getSource('backup') as IndexedDBSource;
  const reloadOrgs = async (localId: string, reloadAll: boolean) => {
    const orgmem = findRecord(memory, 'organizationmembership', localId);
    if (orgmem) {
      if (related(orgmem, 'user') === user) {
        for (const table of [
          'organization',
          'orgworkflowstep',
          'organizationmembership',
          'organizationbible',
        ]) {
          await pullRemoteToMemory({ table, memory, remote });
        }
      }
    } else {
      if (reloadAll)
        await pullRemoteToMemory({
          table: 'organizationmembership',
          memory,
          remote,
        });
      return true;
    }
    return false;
  };

  const reloadProjects = async (localId: string, reloadAll: boolean) => {
    const grpmem = findRecord(memory, 'groupmembership', localId);
    if (grpmem) {
      if (related(grpmem, 'user') === user) {
        for (const table of ['group', 'project', 'plan', 'groupmembership']) {
          await pullRemoteToMemory({ table, memory, remote });
        }
      }
    } else {
      if (reloadAll)
        await pullRemoteToMemory({ table: 'groupmembership', memory, remote });
      return true;
    }
    return false;
  };
  const processTableChanges = async (
    transforms: RecordTransform[],
    isUser: boolean,
    fetchUrl?: (props: IFetchNowProps) => Promise<string | undefined>,
    cb?: () => void
  ) => {
    const setRelated = (
      newOps: RecordOperation[],
      tb: RecordTransformBuilder,
      relationship: string,
      record: RecordIdentity,
      value: string
    ) => {
      let table = relationship;
      switch (relationship) {
        case 'transcriber':
        case 'editor':
          table = 'user';
      }
      newOps.push(
        ...ReplaceRelatedRecord(tb, record, relationship, table, value)
      );
    };
    const resetRelated = (
      newOps: RecordOperation[],
      tb: RecordTransformBuilder,
      relationship: string,
      record: RecordIdentity
    ) => {
      setRelated(newOps, tb, relationship, record, '');
    };

    const DeleteLocalCopy = (
      offlineId: string | undefined | null,
      type: string,
      tb: RecordTransformBuilder,
      localOps: RecordOperation[]
    ) => {
      if (offlineId) {
        const myRecord = findRecord(memory, type, offlineId);
        if (myRecord) {
          localOps.push(
            tb
              .removeRecord({
                type: type,
                id: offlineId,
              })
              .toOperation()
          );
        }
      }
    };

    for (const tr of transforms) {
      const tb = new RecordTransformBuilder();
      const localOps: RecordOperation[] = [];
      let upRec: UpdateRecordOperation;

      let myOps = tr.operations;
      if (!Array.isArray(myOps)) myOps = [myOps];
      const ops = myOps.filter(
        (o) =>
          o.op !== 'updateRecord' ||
          Boolean((o as UpdateRecordOperation).record.relationships) ||
          ((o as UpdateRecordOperation).record.type === 'user' && isUser) //user doesn't have any
      );
      await backup.sync((t) => ops);
      await memory.sync((t) => ops);
      var reloadAllOrgs = false;
      var reloadAllProjects = false;
      for (const o of myOps) {
        if (o.op === 'updateRecord') {
          upRec = o as UpdateRecordOperation;
          if (
            !upRec.record.relationships &&
            !(isUser && upRec.record.type !== 'user')
          )
            //this is just an included record and wasn't changed
            continue;
          switch (upRec.record.type) {
            case 'section':
              if (upRec.record.relationships?.transcriber === undefined)
                resetRelated(localOps, tb, 'transcriber', upRec.record);
              if (upRec.record.relationships?.editor === undefined)
                resetRelated(localOps, tb, 'editor', upRec.record);
              break;

            case 'mediafile':
              //await CheckUploadLocal(upRec);
              DeleteLocalCopy(
                upRec.record.attributes?.offlineId as string | undefined,
                upRec.record.type,
                tb,
                localOps
              );
              if (upRec.record.relationships?.passage === undefined)
                resetRelated(localOps, tb, 'passage', upRec.record);
              var localId = remoteIdGuid(
                'mediafile',
                upRec.record?.keys?.remoteId ?? '',
                memory?.keyMap as RecordKeyMap
              );
              if (localId) {
                var mr = findRecord(memory, 'mediafile', localId) as MediaFileD;
                if (related(mr, 'plan') === undefined)
                  setRelated(
                    localOps,
                    tb,
                    'plan',
                    mr,
                    (upRec.record.relationships?.plan?.data as RecordIdentity)
                      ?.id ?? ''
                  );
              }
              if (fetchUrl && upRec.record?.keys?.remoteId)
                await fetchUrl({
                  id: upRec.record.keys.remoteId,
                  cancelled: () => false,
                }); //downloads the file
              break;

            case 'user':
              SetUserLanguage(memory, user, setLanguage);
              break;

            case 'discussion':
            case 'comment':
            case 'intellectualproperty':
            case 'orgkeytermtarget':
            case 'passagestatechange':
              DeleteLocalCopy(
                upRec.record.attributes?.offlineId as string | undefined,
                upRec.record.type,
                tb,
                localOps
              );
              break;

            case 'invitation':
              const userrec = GetUser(memory, user);
              if (
                (upRec.record as Invitation).attributes?.email.toLowerCase() ===
                userrec.attributes.email.toLowerCase()
              )
                AcceptInvitation(remote, upRec.record as InvitationD);
              break;
            case 'organizationmembership':
              reloadAllOrgs =
                (await reloadOrgs(upRec.record.id, false)) || reloadAllOrgs;
              break;
            case 'groupmembership':
              reloadAllProjects =
                (await reloadProjects(upRec.record.id, false)) ||
                reloadAllProjects;
              break;
          }
        }
      }
      if (reloadAllOrgs) reloadOrgs('x', true);
      if (reloadAllProjects) reloadProjects('x', true);
      if (localOps.length > 0) {
        await backup.sync((t) => localOps);
        await memory.sync((t) => localOps);
      }
    }
    if (cb) cb();
  };

  try {
    const response = await axiosGet(api, params, token);
    const data = response?.data as DataChange | null;
    if (data === null) return started;
    const changes = data?.attributes?.changes;
    const deletes = data?.attributes?.deleted;
    setDataChangeCount(changes.length + deletes.length);
    for (const table of changes) {
      if (table.ids.length > 0) {
        if (!remote) return started;
        var results = await remote.query(
          (q) =>
            q
              .findRecords(table.type)
              .filter({ attribute: 'id-list', value: table.ids.join('|') }),
          { fullResponse: true }
        );
        if (results?.transforms)
          await processTableChanges(
            results.transforms,
            table.type === 'user',
            fetchUrl,
            cb
          );
      }
    }
    setDataChangeCount(deletes.length);
    const tb: RecordTransformBuilder = new RecordTransformBuilder();

    for (let ix = 0; ix < deletes.length; ix++) {
      const table = deletes[ix];
      let operations: RecordOperation[] = [];
      // eslint-disable-next-line no-loop-func
      table.ids.forEach((r) => {
        const localId = remoteIdGuid(
          table.type,
          r.toString(),
          memory?.keyMap as RecordKeyMap
        );
        if (localId) {
          switch (table.type) {
            case 'organizationmembership':
              reloadOrgs(localId, true);
              break;
            case 'groupmembership':
              reloadProjects(localId, true);
              break;
          }
          operations.push(
            tb.removeRecord({ type: table.type, id: localId }).toOperation()
          );
        }
      });
      if (operations.length > 0) {
        await backup.sync((t) => operations);
        await memory.sync((t) => operations);
      }
    }

    setDataChangeCount(0);
    return data?.attributes?.startnext;
  } catch (e: any) {
    logError(Severity.error, errorReporter, e);
    if ((e.response?.data?.errors?.length ?? 0) > 0) {
      var s = e.response.data.errors[0].detail?.toString();
      if (s.startsWith('Project not')) return -2;
    }
    return started;
  }
};
export const doDataChanges = async (
  token: string,
  coordinator: Coordinator,
  fingerprint: string,
  projectsLoaded: string[],
  getOfflineProject: (plan: string | Plan | VProject) => OfflineProject,
  errorReporter: any,
  user: string,
  setLanguage: typeof actions.setLanguage,
  setDataChangeCount: (value: number) => void,
  fetchUrl?: (props: IFetchNowProps) => Promise<string | undefined>,
  notPastTime?: string
) => {
  const memory = coordinator?.getSource('memory') as Memory;
  const remote = coordinator?.getSource('remote') as JSONAPISource; //to check busy
  const backup = coordinator?.getSource('backup') as IndexedDBSource;
  const userLastTimeKey = localUserKey(LocalKey.time);
  const userNextStartKey = localUserKey(LocalKey.start);
  if (!remote || !remote.activated) return;
  let startNext = 0;
  let lastTime = localStorage.getItem(userLastTimeKey) || currentDateTime(); // should not happen
  if (notPastTime && Date.parse(lastTime) > Date.parse(notPastTime))
    lastTime = notPastTime;
  let nextTime = currentDateTime();

  const updateSnapshotDate = async (
    pid: string,
    newDate: string,
    start: number
  ) => {
    const oparray: RecordOperation[] = [];
    offlineProjectUpdateSnapshot(pid, oparray, memory, newDate, start, false);
    await backup.sync((t) => oparray);
    await memory.sync((t) => oparray);
  };

  const version = backup.cache.dbVersion;

  const api = API_CONFIG.host + '/api/datachanges/v' + version.toString() + '/';
  let start = 1;
  let tries = 5;
  if (isElectron) {
    for (let ix = 0; ix < projectsLoaded.length; ix++) {
      const p = projectsLoaded[ix];
      const op = getOfflineProject(p);
      if (
        !isNaN(remoteIdNum('project', p, memory?.keyMap as RecordKeyMap)) &&
        op.attributes?.snapshotDate &&
        Date.parse(op.attributes.snapshotDate) < Date.parse(lastTime)
      ) {
        start = 0;
        startNext = 0;
        tries = 5;
        while (startNext >= 0 && tries > 0) {
          startNext = await processDataChanges({
            token,
            api: `${api}${startNext}/project/${fingerprint}`,
            params: new URLSearchParams([
              [
                'projlist',
                JSON.stringify({
                  id: remoteId('project', p, memory?.keyMap as RecordKeyMap),
                  since: op.attributes.snapshotDate,
                }),
              ],
            ]),
            started: start,
            coordinator,
            user,
            errorReporter,
            setLanguage,
            setDataChangeCount,
            fetchUrl,
          });
          if (startNext === start) tries--;
          else start = startNext;
        }

        if (startNext === -1)
          await updateSnapshotDate(p, nextTime, startNext + 1); //done
        else if (startNext > 0)
          //network error but not a known unrecoverable one so don't move on
          await updateSnapshotDate(p, op.attributes.snapshotDate, startNext);
      }
    }
  }
  startNext = parseInt(localStorage.getItem(userNextStartKey) || '0', 10);
  start = 1;
  tries = 5;
  while (startNext >= 0 && tries > 0) {
    startNext = await processDataChanges({
      token,
      api: `${api}${startNext}/since/${lastTime}?origin=${fingerprint}`,
      params: undefined,
      started: start,
      coordinator,
      user,
      errorReporter,
      setLanguage,
      setDataChangeCount,
      fetchUrl,
    });
    if (startNext === start) tries--;
    else start = startNext;
  }
  if (startNext === -1) localStorage.setItem(userLastTimeKey, nextTime);
  if (startNext !== -2)
    localStorage.setItem(userNextStartKey, (startNext + 1).toString());
  else {
    if (version === 6) {
      let operations: RecordOperation[] = [];
      //clean up abandoned pscs
      var pscs = (
        memory.cache.query((q) =>
          q.findRecords('passagestatechange')
        ) as PassageStateChangeD[]
      ).filter((p) => !Boolean(p.keys?.remoteId));
      if (pscs.length > 0) {
        const tb = new RecordTransformBuilder();
        pscs.forEach((p) =>
          operations.push(
            tb.removeRecord({ type: p?.type, id: p.id }).toOperation()
          )
        );
        await backup.sync((t) => operations);
        await memory.sync((t) => operations);
      }
    }
  }
};

export function DataChanges(props: PropsWithChildren) {
  const { children } = props;
  const dispatch = useDispatch();
  const setLanguage = (lang: string) => dispatch(actions.setLanguage(lang));
  const [isOffline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator?.getSource('memory') as Memory;
  const remote = coordinator?.getSource('remote') as JSONAPISource; //to check busy
  const [loadComplete] = useGlobal('loadComplete');
  const [, setBusy] = useGlobal('remoteBusy');
  const [, setDataChangeCount] = useGlobal('dataChangeCount');
  const [connected] = useGlobal('connected'); //verified this is not used in a function 2/18/25
  const [user] = useGlobal('user');
  const [fingerprint] = useGlobal('fingerprint');
  const [errorReporter] = useGlobal('errorReporter');
  const ctx = useContext(TokenContext).state;
  const { authenticated } = ctx;
  const [busyDelay, setBusyDelay] = useState<number | null>(null);
  const [dataDelay, setDataDelay] = useState<number | null>(null);
  const [firstRun, setFirstRun] = useState(true);
  const doingChanges = useRef(false);
  const getOfflineProject = useOfflnProjRead();
  const checkOnline = useCheckOnline('DataChanges');
  const { anySaving, toolsChanged } = useContext(UnsavedContext).state;
  const defaultBackupDelay = isOffline ? 1000 * 60 * 30 : null; //30 minutes;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saving = useMemo(() => anySaving(), [toolsChanged]);
  const doSanityCheck = useSanityCheck(setLanguage);
  const { getBibleMediaProject, getBibleMediaPlan } = useBibleMedia();
  const fetchUrl = useFetchUrlNow();
  const users = useOrbitData<UserD[]>('user');
  const defaultDataDelayInMinutes = 2;
  const [userDataDelay, setUserDataDelay] = useState(defaultDataDelayInMinutes);
  const getGlobal = useGetGlobal();
  useEffect(() => {
    var userRec = findRecord(memory, 'user', user) as UserD; //make sure we have the user record in memory
    const hk = JSON.parse(userRec?.attributes?.hotKeys ?? '{}');
    setUserDataDelay(hk.syncFreq ?? defaultDataDelayInMinutes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, user]);

  useEffect(() => {
    const defaultBusyDelay = 1000;
    const defaultDataDelay = 1000 * (userDataDelay * 60);

    setFirstRun(dataDelay === null);
    //if userDataDelay = 0, then we don't want to sync but don't set it to null
    //because that means we haven't run yet.
    const newDelay =
      connected && loadComplete && remote && authenticated()
        ? dataDelay === null
          ? 10
          : defaultDataDelay
        : null;
    setDataDelay(newDelay);

    if (!remote) setBusy(false);
    // the busy delay is increased by 10 times if we aren't connected yet
    // but should be because we have authenticated.
    setBusyDelay(
      remote && authenticated() ? defaultBusyDelay * (connected ? 1 : 10) : null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote, ctx, loadComplete, connected, firstRun, userDataDelay]);

  const updateBusy = useCallback(() => {
    const checkBusy =
      getGlobal('user') === '' ||
      (remote && remote.requestQueue.length !== 0) ||
      getGlobal('orbitRetries') < OrbitNetworkErrorRetries;
    //we know we're offline, or we've retried something so maybe we're offline
    if (!getGlobal('connected') || checkBusy) {
      checkOnline((result) => {
        if ((checkBusy && result) !== getGlobal('remoteBusy')) {
          setBusy(checkBusy && result);
        }
      });
    } else if (checkBusy !== getGlobal('remoteBusy')) {
      setBusy(checkBusy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote, user]);

  const updateData = async () => {
    if (
      !doingChanges.current &&
      !getGlobal('remoteBusy') &&
      !getGlobal('importexportBusy') &&
      !saving &&
      authenticated()
    ) {
      doingChanges.current = true; //attempt to prevent double calls
      var check = firstRun;
      setFirstRun(false);
      await doDataChanges(
        ctx.accessToken || '',
        coordinator,
        fingerprint,
        getGlobal('projectsLoaded'),
        getOfflineProject,
        errorReporter,
        user,
        setLanguage,
        setDataChangeCount,
        isElectron ? fetchUrl : undefined
      );
      if (check) {
        //make sure we have a bible media project and plan downloaded
        await getBibleMediaPlan();
        await doSanityCheck((await getBibleMediaProject())?.id);
        for (var ix = 0; ix < getGlobal('projectsLoaded').length; ix++)
          await doSanityCheck(getGlobal('projectsLoaded')[ix]);
      }
      doingChanges.current = false; //attempt to prevent double calls
    }
  };

  const backupElectron = () => {
    if (!getGlobal('remoteBusy') && !saving && getGlobal('project') !== '') {
      electronExport(
        ExportType.ITFBACKUP,
        undefined, //all artifact types
        memory,
        undefined,
        getGlobal('project'),
        user,
        '',
        '',
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
  useInterval(updateData, (dataDelay ?? 0) <= 0 ? null : dataDelay);
  useInterval(backupElectron, defaultBackupDelay);
  // render the children component.
  return children as JSX.Element;
}
export default DataChanges;
