import {
  IApiError,
  Role,
  Plan,
  OfflineProject,
  VProject,
  ExportType,
  UserD,
} from './model';
import Coordinator, {
  RequestStrategy,
  SyncStrategy,
  LogLevel,
  EventLoggingStrategy,
} from '@orbit/coordinator';
import Bugsnag from '@bugsnag/js';
import IndexedDBSource from '@orbit/indexeddb';
import IndexedDBBucket from '@orbit/indexeddb-bucket';
import JSONAPISource from '@orbit/jsonapi';
import { RecordTransform } from '@orbit/records';
import { NetworkError } from '@orbit/jsonapi';
import { Bucket, Exception } from '@orbit/core';
import Memory from '@orbit/memory';
import { ITokenContext } from './context/TokenProvider';
import { API_CONFIG, isElectron } from './api-variable';
import {
  logError,
  infoMsg,
  Severity,
  LocalKey,
  orbitErr,
  orbitRetry,
} from './utils';
import { electronExport } from './store/importexport/electronExport';
import { restoreBackup } from '.';
import { AlertSeverity } from './hoc/SnackBar';
import { updateBackTranslationType } from './crud/updateBackTranslationType';
import { updateConsultantWorkflowStep } from './crud/updateConsultantWorkflowStep';
import { serializersSettings } from './serializers/serializersFor';
import { requestedSchema } from './schema';
type StategyError = (...args: unknown[]) => unknown;

interface PullStratErrProps {
  tokenCtx: ITokenContext;
  orbitError: (ex: IApiError) => void;
  setOrbitRetries: (r: number) => void;
  showMessage: (msg: string | JSX.Element, alert?: AlertSeverity) => void;
  memory: Memory;
  remote: JSONAPISource;
  orbitRetries: any;
  errorReporter: any;
}
interface QueryStratErrProps {
  tokenCtx: ITokenContext;
  orbitError: (ex: IApiError) => void;
  remote: JSONAPISource;
}

const queryError =
  ({ tokenCtx, orbitError, remote }: QueryStratErrProps) =>
  (transform: RecordTransform, ex: any) => {
    console.log('***** api query fail', transform, ex);
    if (ex instanceof Exception && (ex as IApiError).response?.status === 401) {
      tokenCtx?.state.logout();
    } else if (
      ex instanceof NetworkError ||
      (ex instanceof Error &&
        (ex.message === 'Failed to fetch' || ex.message === 'Network Error'))
    ) {
      orbitError(ex as IApiError);
    }
    return remote.requestQueue.retry;
  };
const updateError =
  ({
    tokenCtx,
    orbitError,
    setOrbitRetries,
    showMessage,
    memory,
    remote,
    orbitRetries,
  }: PullStratErrProps) =>
  (transform: RecordTransform, ex: any) => {
    console.log('***** api update fail', transform, ex);
    if (ex instanceof Exception && (ex as IApiError).response?.status === 401) {
      tokenCtx?.state.logout();
    } else if (
      ex instanceof NetworkError ||
      (ex instanceof Error &&
        (ex.message === 'Network Error' || ex.message === 'Failed to fetch'))
    ) {
      if (orbitRetries > 0) {
        setOrbitRetries(orbitRetries - 1);
        // When network errors are encountered, try again in 3s
        orbitError(orbitRetry(null, 'NetworkError - will try again soon'));
        setTimeout(() => {
          remote.requestQueue.retry();
        }, 3000);
      } else {
        //ran out of retries -- bucket will retry later
      }
    } else {
      // When non-network errors occur, notify the user and
      // reset state.
      const data = (ex as any).data;
      const detail =
        data?.errors &&
        Array.isArray(data.errors) &&
        data.errors.length > 0 &&
        data.errors[0].meta &&
        data.errors[0].meta.stackTrace[0];

      if (detail?.includes('Entity has been deleted')) {
        console.log('***attempt to update deleted record');
        showMessage(detail);
      } else {
        const response = ex.response as any;
        const url: string = response?.url ?? '';
        let myOp = transform.operations;
        if (Array.isArray(myOp)) myOp = myOp[0];
        let label =
          (transform?.options?.label ||
            myOp.op + (url ? ` in ` + url.split('/').pop() + `: ` : '')) +
          (detail ?? '');
        orbitError(orbitErr(ex, `Unable to complete "${label}"`));
      }

      // Roll back memory to position before transform
      if (memory.transformLog.contains(transform.id)) {
        //don't do this -- resets error to 0 and takes user away from continue/logout screen
        //orbitError(
        //  orbitInfo(null, 'Rolling back - transform:' + transform.id)
        //);
        memory.rollback(transform.id, -1);
      }

      return remote.requestQueue.skip();
    }
  };
export const Sources = async (
  coordinator: Coordinator,
  tokenCtx: ITokenContext,
  fingerprint: string,
  errorReporter: any,
  orbitRetries: number,
  setUser: (id: string) => void,
  setProjectsLoaded: (valud: string[]) => void,
  orbitError: (ex: IApiError) => void,
  setOrbitRetries: (r: number) => void,
  setLang: (locale: string) => void,
  getOfflineProject: (plan: Plan | VProject | string) => OfflineProject,
  offlineSetup: () => Promise<void>,
  showMessage: (msg: string | JSX.Element, alert?: AlertSeverity) => void
) => {
  const memory = coordinator?.getSource('memory') as Memory;
  const backup = coordinator?.getSource('backup') as IndexedDBSource;
  const tokData = tokenCtx.state.profile || { sub: '' };
  const userToken = localStorage.getItem(LocalKey.authId);
  if (tokData.sub !== '') {
    localStorage.setItem(LocalKey.authId, tokData.sub || '');
  }

  const bucket: Bucket = new IndexedDBBucket({
    namespace:
      'transcriber-' + (tokData.sub || '').replace(/\|/g, '-') + '-bucket',
  }) as any;

  //set up strategies
  // Update indexedDb when memory updated
  if (!coordinator.strategyNames.includes('sync-backup'))
    coordinator.addStrategy(
      new SyncStrategy({
        name: 'sync-backup',
        source: 'memory',
        target: 'backup',
        blocking: true,
      })
    );
  if (!coordinator.strategyNames.includes('logging'))
    coordinator.addStrategy(new EventLoggingStrategy({ name: 'logging' }));

  let remote: JSONAPISource = {} as JSONAPISource;
  let datachangeremote: JSONAPISource = {} as JSONAPISource;

  const offline = !tokenCtx.state.accessToken;

  if (!offline) {
    remote = coordinator.sourceNames.includes('remote')
      ? (coordinator?.getSource('remote') as JSONAPISource)
      : new JSONAPISource({
          schema: memory?.schema,
          keyMap: memory?.keyMap,
          bucket,
          name: 'remote',
          namespace: 'api',
          host: API_CONFIG.host,
          serializerSettingsFor: serializersSettings(),
          defaultFetchSettings: {
            headers: {
              Authorization: 'Bearer ' + tokenCtx.state.accessToken,
              'X-FP': fingerprint,
            },
            timeout: 100000,
          },
          defaultTransformOptions: {
            useRemoteId: true,
          },
        });
    if (!coordinator.sourceNames.includes('remote')) {
      coordinator.addSource(remote);
    }

    // Trap error querying data (token expired or offline)
    if (!coordinator.strategyNames.includes('remote-query-fail'))
      coordinator.addStrategy(
        new RequestStrategy({
          name: 'remote-query-fail',

          source: 'remote',
          on: 'queryFail',
          action: queryError({
            tokenCtx,
            orbitError,
            remote,
          }) as unknown as StategyError,
          blocking: true,
        })
      );
    if (!coordinator.strategyNames.includes('remote-update-fail'))
      coordinator.addStrategy(
        new RequestStrategy({
          name: 'remote-update-fail',

          source: 'remote',
          on: 'updateFail',
          action: updateError({
            tokenCtx,
            orbitError,
            setOrbitRetries,
            showMessage,
            memory,
            remote,
            orbitRetries,
            errorReporter,
          }) as unknown as StategyError,
          blocking: true,
        })
      );
    // Query the remote server whenever the memory is queried
    if (!coordinator.strategyNames.includes('remote-request'))
      coordinator.addStrategy(
        new RequestStrategy({
          name: 'remote-request',

          source: 'memory',
          on: 'beforeQuery',

          target: 'remote',
          action: 'query',

          blocking: false,
        })
      );

    // Trap error updating data (token expired or offline)
    // See: https://github.com/orbitjs/todomvc-ember-orbit

    // Update the remote server whenever the memory is updated
    if (!coordinator.strategyNames.includes('remote-update'))
      coordinator.addStrategy(
        new RequestStrategy({
          name: 'remote-update',

          source: 'memory',
          on: 'beforeUpdate',

          target: 'remote',
          action: 'update',

          blocking: false,
        })
      );

    // Sync all changes received from the remote server to the memory
    if (!coordinator.strategyNames.includes('remote-sync'))
      coordinator.addStrategy(
        new SyncStrategy({
          name: 'remote-sync',

          source: 'remote',
          target: 'memory',

          blocking: true,
        })
      );

    datachangeremote = coordinator.sourceNames.includes('datachanges')
      ? (coordinator?.getSource('datachanges') as JSONAPISource)
      : new JSONAPISource({
          schema: memory?.schema,
          keyMap: memory?.keyMap,
          bucket: new IndexedDBBucket({
            namespace:
              'datachanges-' +
              (tokData.sub || '').replace(/\|/g, '-') +
              '-bucket',
          }),
          name: 'datachanges',
          namespace: 'api',
          host: API_CONFIG.host,
          serializerSettingsFor: serializersSettings(),
          defaultFetchSettings: {
            headers: {
              Authorization: 'Bearer ' + tokenCtx.state.accessToken,
              'X-FP': fingerprint,
            },
            timeout: 100000,
          },
          defaultTransformOptions: {
            useRemoteId: true,
          },
        });
    if (!coordinator.sourceNames.includes('datachanges')) {
      coordinator.addSource(datachangeremote);
    }
  } //!offline
  if (!coordinator.activated)
    await coordinator.activate({ logLevel: LogLevel.Warnings });

  console.log('Coordinator will log warnings');

  let goRemote =
    !offline &&
    (userToken !== tokData.sub || localStorage.getItem('inviteId') !== null);
  if (!goRemote) {
    console.log('using backup');
    if (!isElectron) {
      //already did this if electron...
      setProjectsLoaded(await restoreBackup(coordinator));
      const recs: Role[] = memory?.cache.query((q) =>
        q.findRecords('role')
      ) as any;
      if (recs.length === 0) {
        //orbitError(orbitInfo(null, 'Indexed DB corrupt or missing.'));
        goRemote = true;
      }
    }
    //get v4 data
    if (requestedSchema > 3) {
      if (offline) {
        await offlineSetup();
      }
    }
  }

  var syncBuffer: Buffer | undefined = undefined;
  var syncFile = '';
  if (!offline && isElectron) {
    var fr = await electronExport(
      ExportType.ITFSYNC,
      undefined, //all artifact types
      memory,
      backup,
      0,
      0,
      '',
      '',
      getOfflineProject
    ).catch((err: Error) => {
      console.log(
        'ITFSYNC export failed: ',
        err.message,
        err.name,
        err.cause,
        err.stack
      );
      logError(
        Severity.error,
        errorReporter,
        infoMsg(err, 'ITFSYNC export failed: ')
      );
      throw err;
    });
    if (fr && fr.changes > 0) {
      syncBuffer = fr.buffer;
      syncFile = fr.message;
    }
  }
  /* set the user from the token - must be done after the backup is loaded and after changes to offline are recorded */
  if (!offline) {
    await remote.activated;
    let uRecs = (await remote.query((q) =>
      q.findRecords('user').filter({ attribute: 'auth0Id', value: tokData.sub })
    )) as UserD[];
    if (!Array.isArray(uRecs)) uRecs = [uRecs];
    const user = uRecs[0];
    const locale = user?.attributes?.locale || 'en';
    setLang(locale);
    localStorage.setItem(LocalKey.userId, user.id);
    localStorage.setItem(LocalKey.onlineUserId, user.id);
    if (errorReporter && localStorage.getItem(LocalKey.connected) !== 'false')
      Bugsnag.setUser(user.keys?.remoteId ?? user.id);
  }
  var user = localStorage.getItem(LocalKey.userId) as string;
  setUser(user);
  if (requestedSchema > 4) {
    await updateBackTranslationType(
      memory,
      tokenCtx.state.accessToken || '',
      user,
      errorReporter,
      offlineSetup
    );
  }
  if (requestedSchema > 5) {
    const token = tokenCtx.state.accessToken || null;
    await updateConsultantWorkflowStep(token, memory, user);
  }
  return { syncBuffer, syncFile, goRemote };
};
