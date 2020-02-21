import { Base64 } from 'js-base64';
import moment from 'moment';
import { IApiError } from './model';
import Coordinator, {
  RequestStrategy,
  SyncStrategy,
  LogLevel,
  EventLoggingStrategy,
} from '@orbit/coordinator';
import IndexedDBSource from '@orbit/indexeddb';
import IndexedDBBucket from '@orbit/indexeddb-bucket';
import JSONAPISource from '@orbit/jsonapi';
import { Schema, KeyMap, Transform, NetworkError } from '@orbit/data';
import { Bucket } from '@orbit/core';
import Memory from '@orbit/memory';
import Auth from './auth/Auth';
import { API_CONFIG } from './api-variable';
import { JSONAPISerializerCustom } from './serializers/JSONAPISerializerCustom';

// import { Online } from './utils';

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
  InviteUser: (remote: JSONAPISource) => Promise<void>,
  tableLoaded: (name: string) => void,
  orbitError: (ex: IApiError) => void
) => {
  const tokenPart = auth.accessToken ? auth.accessToken.split('.') : [];
  const tokData = JSON.parse(
    tokenPart.length > 1 ? Base64.decode(tokenPart[1]) : '{"sub":""}'
  );
  const userToken = localStorage.getItem('user-token');

  const bucket: Bucket = new IndexedDBBucket({
    namespace: 'transcriber-' + tokData.sub.replace(/\|/g, '-') + '-bucket',
  }) as any;
  setBucket(bucket);

  if (process.env.REACT_APP_MODE !== 'electron') {
    //already did this if electron...
    if (tokData.sub === userToken) {
      await backup
        .pull(q => q.findRecords())
        .then(transform => memory.sync(transform));
    } else {
      backup.reset();
    }
  }

  let remote: JSONAPISource = {} as JSONAPISource;

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
    setRemote(remote);
  }

  const coordinator = new Coordinator();
  coordinator.addSource(memory);
  coordinator.addSource(backup);

  if (!offline) {
    coordinator.addSource(remote);
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
            console.log('NetworkError - will try again soon');
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
              console.log('Rolling back - transform:', transform.id);
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
    if (userToken === tokData.sub || offline) {
      setUser(localStorage.getItem('user-id') as string);
    }
  });

  if (!offline && userToken !== tokData.sub) {
    localStorage.setItem('lastTime', moment.utc().toISOString());
    await InviteUser(remote);

    await remote
      .pull(q => q.findRecords('currentuser'))
      .then((transform: Transform[]) => {
        memory.sync(transform);
        const user = (transform[0].operations[0] as any).record;
        setUser(user.id);
        localStorage.setItem('user-id', user.id);
      });
    await remote
      .pull(q => q.findRecords('user'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(5));
    await remote
      .pull(q => q.findRecords('organization'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(14));
    await remote
      .pull(q => q.findRecords('organizationmembership'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(28));
    await remote
      .pull(q => q.findRecords('group'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(42));
    await remote
      .pull(q => q.findRecords('groupmembership'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(56));
    await remote
      .pull(q => q.findRecords('project'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(70));
    await remote
      .pull(q => q.findRecords('role'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(84));
    await remote
      .pull(q => q.findRecords('plan'))
      .then(transform => {
        memory.sync(transform);
        if (tokData.sub !== '') {
          localStorage.setItem('user-token', tokData.sub);
        }
        tableLoaded('plan'); // If we are loading, length of tableLoad > 0
      })
      .then(() => setCompleted(95));
    remote
      .pull(q => q.findRecords('section'))
      .then(transform => memory.sync(transform))
      .then(() => tableLoaded('section'));
    remote
      .pull(q => q.findRecords('passagesection'))
      .then(transform => memory.sync(transform))
      .then(() => tableLoaded('passagesection'));
    remote
      .pull(q => q.findRecords('passage'))
      .then(transform => memory.sync(transform))
      .then(() => tableLoaded('passage'));
    remote
      .pull(q => q.findRecords('mediafile'))
      .then(transform => memory.sync(transform))
      .then(() => tableLoaded('mediafile'));
    remote
      .pull(q => q.findRecords('plantype'))
      .then(transform => memory.sync(transform))
      .then(() => tableLoaded('plantype'));
    remote
      .pull(q => q.findRecords('integration'))
      .then(transform => memory.sync(transform))
      .then(() => tableLoaded('integration'));
    remote
      .pull(q => q.findRecords('projectintegration'))
      .then(transform => memory.sync(transform))
      .then(() => tableLoaded('projectintegration'));
    remote
      .pull(q => q.findRecords('invitation'))
      .then(transform => memory.sync(transform))
      .then(() => tableLoaded('invitation'));
    remote
      .pull(q => q.findRecords('projecttype'))
      .then(transform => memory.sync(transform))
      .then(() => tableLoaded('projecttype'));
    remote
      .pull(q => q.findRecords('activitystate'))
      .then(transform => memory.sync(transform))
      .then(() => tableLoaded('activitystate'));
    remote
      .pull(q => q.findRecords('passagestatechange'))
      .then(transform => memory.sync(transform))
      .then(() => tableLoaded('passagestatechange'));
  }

  setCompleted(100);
};

export default Sources;
