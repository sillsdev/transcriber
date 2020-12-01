import {
  IApiError,
  Role,
  Plan,
  Section,
  OfflineProject,
  VProject,
  ExportType,
} from './model';
import Coordinator, {
  RequestStrategy,
  SyncStrategy,
  LogLevel,
  EventLoggingStrategy,
} from '@orbit/coordinator';
import IndexedDBSource from '@orbit/indexeddb';
import IndexedDBBucket from '@orbit/indexeddb-bucket';
import JSONAPISource from '@orbit/jsonapi';
import { Transform, NetworkError, QueryBuilder } from '@orbit/data';
import { Bucket } from '@orbit/core';
import Memory from '@orbit/memory';
import Auth from './auth/Auth';
import { API_CONFIG, isElectron } from './api-variable';
import {
  getSerializer,
  JSONAPISerializerCustom,
} from './serializers/JSONAPISerializerCustom';
import { related } from './crud';
import { orbitRetry, orbitErr, logError, infoMsg, Severity } from './utils';
import { electronExport } from './store/importexport/electronExport';

export const Sources = async (
  coordinator: Coordinator,
  auth: Auth,
  fingerprint: string,
  setUser: (id: string) => void,
  setProjectsLoaded: (valud: string[]) => void,
  setCoordinatorActivated: (valud: boolean) => void,
  orbitError: (ex: IApiError) => void,
  setOrbitRetries: (r: number) => void,
  globalStore: any,
  getOfflineProject: (plan: Plan | VProject | string) => OfflineProject
) => {
  const memory = coordinator.getSource('memory') as Memory;
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  const tokData = auth.getProfile() || { sub: '' };
  const userToken = localStorage.getItem('auth-id');
  if (tokData.sub !== '') {
    localStorage.setItem('auth-id', tokData.sub);
  }

  const bucket: Bucket = new IndexedDBBucket({
    namespace: 'transcriber-' + tokData.sub.replace(/\|/g, '-') + '-bucket',
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

  const offline = !auth.accessToken;

  if (!offline) {
    remote = coordinator.sourceNames.includes('remote')
      ? (coordinator.getSource('remote') as JSONAPISource)
      : new JSONAPISource({
          schema: memory.schema,
          keyMap: memory.keyMap,
          bucket,
          name: 'remote',
          namespace: 'api',
          host: API_CONFIG.host,
          SerializerClass: JSONAPISerializerCustom,
          defaultFetchSettings: {
            headers: {
              Authorization: 'Bearer ' + auth.accessToken,
              'X-FP': fingerprint,
            },
            timeout: 100000,
          },
        });
    remote.requestProcessor.serializer.resourceKey = () => {
      return 'remoteId';
    };

    if (!coordinator.sourceNames.includes('remote')) {
      if (coordinator.activated) await coordinator.deactivate();
      coordinator.addSource(remote);
    }

    // Trap error querying data (token expired or offline)
    if (!coordinator.strategyNames.includes('remote-pull-fail'))
      coordinator.addStrategy(
        new RequestStrategy({
          name: 'remote-pull-fail',

          source: 'remote',
          on: 'pullFail',

          action(transform: Transform, ex: IApiError) {
            console.log('***** api pull fail', transform, ex);
            orbitError(ex);
            return remote.requestQueue.error;
          },

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
          action: 'pull',

          blocking: false,
        })
      );

    // Trap error updating data (token expired or offline)
    // See: https://github.com/orbitjs/todomvc-ember-orbit
    if (!coordinator.strategyNames.includes('remote-push-fail'))
      coordinator.addStrategy(
        new RequestStrategy({
          name: 'remote-push-fail',

          source: 'remote',
          on: 'pushFail',

          action(transform: Transform, ex: IApiError) {
            console.log('***** api pushfail');
            const remote = coordinator.getSource('remote');
            const memory = coordinator.getSource('memory') as Memory;
            //we're passing in the whole dang store because anything futher down
            //was not updated
            if (ex instanceof NetworkError) {
              if (globalStore.orbitRetries > 0) {
                setOrbitRetries(globalStore.orbitRetries - 1);
                // When network errors are encountered, try again in 3s
                orbitError(
                  orbitRetry(null, 'NetworkError - will try again soon')
                );
                setTimeout(() => {
                  remote.requestQueue.retry();
                }, 3000);
              } else {
                //ran out of retries -- bucket will retry later
              }
            } else {
              // When non-network errors occur, notify the user and
              // reset state.
              let label = transform.options && transform.options.label;
              if (label) {
                orbitError(orbitErr(null, `Unable to complete "${label}"`));
              } else {
                const response = ex.response as any;
                const url: string | null = response?.url;
                const data = (ex as any).data;
                const detail =
                  data?.errors &&
                  Array.isArray(data.errors) &&
                  data.errors.length > 0 &&
                  data.errors[0].detail;
                if (url && detail) {
                  orbitError(
                    orbitErr(
                      null,
                      `Unable to complete ` +
                        transform.operations[0].op +
                        ` in ` +
                        url.split('/').pop() +
                        `: ` +
                        detail
                    )
                  );
                } else {
                  orbitError(orbitErr(null, `Unable to complete operation`));
                }
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
          },

          blocking: true,
        })
      );

    // Update the remote server whenever the memory is updated
    if (!coordinator.strategyNames.includes('remote-update'))
      coordinator.addStrategy(
        new RequestStrategy({
          name: 'remote-update',

          source: 'memory',
          on: 'beforeUpdate',

          target: 'remote',
          action: 'push',

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
  } //!offline
  if (!coordinator.activated)
    await coordinator.activate({ logLevel: LogLevel.Warnings });

  setCoordinatorActivated(true);
  console.log('Coordinator will log warnings');

  let goRemote =
    !offline &&
    (userToken !== tokData.sub || localStorage.getItem('inviteId') !== null);
  if (!goRemote) {
    console.log('using backup');
    if (!isElectron) {
      //already did this if electron...
      var transform = await backup.pull((q) => q.findRecords());
      await memory.sync(transform);
      const recs: Role[] = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('role')
      ) as any;
      if (recs.length === 0) {
        //orbitError(orbitInfo(null, 'Indexed DB corrupt or missing.'));
        goRemote = true;
      }
    }

    const loadedplans = new Set(
      (memory.cache.query((q: QueryBuilder) =>
        q.findRecords('section')
      ) as Section[]).map((s) => related(s, 'plan') as string)
    );
    const plans = (memory.cache.query((q: QueryBuilder) =>
      q.findRecords('plan')
    ) as Plan[]).filter((p) => loadedplans.has(p.id));
    const projs = new Set(plans.map((p) => related(p, 'project') as string));
    setProjectsLoaded(Array.from(projs));
  }
  /* set the user from the token - must be done after the backup is loaded */
  if (!offline) {
    var tr = await remote.pull((q) => q.findRecords('currentuser'));
    const user = (tr[0].operations[0] as any).record;
    localStorage.setItem('user-id', user.id);
  }
  setUser(localStorage.getItem('user-id') as string);

  var syncBuffer: Buffer | undefined = undefined;
  var syncFile = '';
  if (!offline && isElectron) {
    var fr = await electronExport(
      ExportType.ITFSYNC,
      memory,
      backup,
      0,
      fingerprint,
      0,
      getSerializer(memory),
      getOfflineProject
    ).catch((err: Error) => {
      logError(
        Severity.error,
        globalStore.errorReporter,
        infoMsg(err, 'ITFSYNC export failed: ')
      );
    });
    if (fr && fr.data.attributes.changes > 0) {
      syncBuffer = fr.data.attributes.buffer;
      syncFile = fr.data.attributes.message;
    }
  }
  return { syncBuffer, syncFile, goRemote };
};
