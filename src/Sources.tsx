import { Base64 } from 'js-base64';
import { IApiError, User, Role, Plan } from './model';
import Coordinator, {
  RequestStrategy,
  SyncStrategy,
  LogLevel,
  EventLoggingStrategy,
} from '@orbit/coordinator';
import IndexedDBSource from '@orbit/indexeddb';
import IndexedDBBucket from '@orbit/indexeddb-bucket';
import JSONAPISource from '@orbit/jsonapi';
import {
  Schema,
  KeyMap,
  Transform,
  NetworkError,
  QueryBuilder,
} from '@orbit/data';
import { Bucket } from '@orbit/core';
import Memory from '@orbit/memory';
import Auth from './auth/Auth';
import { API_CONFIG } from './api-variable';
import { JSONAPISerializerCustom } from './serializers/JSONAPISerializerCustom';
import { currentDateTime } from './utils/currentDateTime';
import { LoadData } from './utils/loadData';
import { orbitInfo, related } from './utils';

export const Sources = async (
  schema: Schema,
  memory: Memory,
  keyMap: KeyMap,
  backup: IndexedDBSource,
  auth: Auth,
  offline: boolean,
  setUser: (id: string) => void,
  setBucket: (bucket: Bucket) => void,
  setRemote: (remote: JSONAPISource) => void,
  setCompleted: (valud: number) => void,
  setProjectsLoaded: (valud: string[]) => void,
  InviteUser: (remote: JSONAPISource, userEmail: string) => Promise<void>,
  orbitError: (ex: IApiError) => void
) => {
  const tokenPart = auth.accessToken ? auth.accessToken.split('.') : [];
  const tokData = JSON.parse(
    tokenPart.length > 1 ? Base64.decode(tokenPart[1]) : '{"sub":""}'
  );
  const userToken = localStorage.getItem('user-token');
  if (tokData.sub !== '') {
    localStorage.setItem('user-token', tokData.sub);
  }

  const bucket: Bucket = new IndexedDBBucket({
    namespace: 'transcriber-' + tokData.sub.replace(/\|/g, '-') + '-bucket',
  }) as any;
  setBucket(bucket);

  let remote: JSONAPISource = {} as JSONAPISource;

  const coordinator = new Coordinator();

  coordinator.addSource(memory);
  coordinator.addSource(backup);

  if (!offline) {
    remote = new JSONAPISource({
      schema,
      keyMap,
      bucket,
      name: 'remote',
      namespace: 'api',
      host: API_CONFIG.host,
      SerializerClass: JSONAPISerializerCustom,
      defaultFetchSettings: {
        headers: {
          Authorization: 'Bearer ' + auth.accessToken,
        },
        timeout: 100000,
      },
    });
    remote.requestProcessor.serializer.resourceKey = () => {
      return 'remoteId';
    };
    coordinator.addSource(remote);
    setRemote(remote);
  }
  let goRemote =
    !offline &&
    (userToken !== tokData.sub || localStorage.getItem('inviteId') !== null);
  if (!goRemote) {
    setUser(localStorage.getItem('user-id') as string);
    console.log('using backup');
    if (process.env.REACT_APP_MODE !== 'electron') {
      //already did this if electron...
      var transform = await backup.pull((q) => q.findRecords());
      await memory.sync(transform);
      const recs: Role[] = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('role')
      ) as any;
      if (recs.length === 0) {
        orbitError(orbitInfo(null, 'Indexed DB corrupt or missing.'));
        goRemote = true;
      }
    }
    const plans = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('plan')
    ) as Plan[];
    const projs = new Set(plans.map((p) => related(p, 'project') as string));
    setProjectsLoaded(Array.from(projs));
  }
  if (goRemote) {
    localStorage.setItem('lastTime', currentDateTime());
    await backup.reset();
    var currentuser: User | undefined;
    var tr = await remote.pull((q) => q.findRecords('currentuser'));
    const user = (tr[0].operations[0] as any).record;
    setUser(user.id);
    localStorage.setItem('user-id', user.id);
    currentuser = user;
    await InviteUser(
      remote,
      currentuser && currentuser.attributes
        ? currentuser.attributes.email
        : 'neverhere'
    );
    setProjectsLoaded([]);
    setCompleted(10);
  }
  // Update indexedDb when memory updated
  // TODO: error if we can't read and write the indexedDB
  coordinator.addStrategy(
    new SyncStrategy({
      source: 'memory',
      target: 'backup',
      blocking: true,
    })
  );

  if (!offline) {
    // Trap error querying data (token expired or offline)
    coordinator.addStrategy(
      new RequestStrategy({
        name: 'remote-pull-fail',

        source: 'remote',
        on: 'pullFail',

        action(transform: Transform, ex: IApiError) {
          console.log('***** api pull fail', transform, ex);
          orbitError(ex);
        },

        blocking: true,
      })
    );

    // Query the remote server whenever the memory is queried
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
    coordinator.addStrategy(
      new RequestStrategy({
        name: 'remote-push-fail',

        source: 'remote',
        on: 'pushFail',

        action(transform: Transform, ex: IApiError) {
          const remote = coordinator.getSource('remote');
          const memory = coordinator.getSource('memory') as Memory;

          if (ex instanceof NetworkError) {
            // When network errors are encountered, try again in 3s
            orbitError(orbitInfo(null, 'NetworkError - will try again soon'));
            setTimeout(() => {
              remote.requestQueue.retry();
            }, 3000);
          } else {
            // When non-network errors occur, notify the user and
            // reset state.
            let label = transform.options && transform.options.label;
            if (label) {
              alert(`Unable to complete "${label}"`);
            } else {
              const response = ex.response as any;
              const url: string | null = response && response.url;
              const data = (ex as any).data;
              const detail =
                data &&
                data.errors &&
                Array.isArray(data.errors) &&
                data.errors.length > 0 &&
                data.errors[0].detail;
              if (url && detail) {
                alert(
                  `Unable to complete ` +
                    transform.operations[0].op +
                    ` in ` +
                    url.split('/').pop() +
                    `: ` +
                    detail
                );
              } else {
                alert(`Unable to complete operation`);
              }
            }

            // Roll back memory to position before transform
            if (memory.transformLog.contains(transform.id)) {
              orbitError(
                orbitInfo(null, 'Rolling back - transform:' + transform.id)
              );
              memory.rollback(transform.id, -1);
            }

            return remote.requestQueue.skip();
          }
        },

        blocking: true,
      })
    );

    // Update the remote server whenever the memory is updated
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
    coordinator.addStrategy(
      new SyncStrategy({
        name: 'remote-sync',

        source: 'remote',
        target: 'memory',

        blocking: true,
      })
    );
  }

  coordinator.addStrategy(new EventLoggingStrategy());
  coordinator.activate({ logLevel: LogLevel.Warnings }).then(() => {
    console.log('Coordinator will log warnings');
    if (goRemote)
      LoadData(memory, backup, remote, setCompleted, orbitError).then(() =>
        setCompleted(90)
      );
    else setCompleted(90);
  });
};

export default Sources;
