import { Base64 } from 'js-base64';
import { User } from './model';
import Coordinator, {
  RequestStrategy,
  SyncStrategy,
  LogLevel,
  EventLoggingStrategy,
} from '@orbit/coordinator';
import IndexedDBSource from '@orbit/indexeddb';
import IndexedDBBucket from '@orbit/indexeddb-bucket';
import JSONAPISource from '@orbit/jsonapi';
import { Schema, KeyMap, Transform } from '@orbit/data';
import { Bucket } from '@orbit/core';
import Memory from '@orbit/memory';
import Auth from './auth/Auth';
import { API_CONFIG } from './api-variable';
import { JSONAPISerializerCustom } from './serializers/JSONAPISerializerCustom';

// import { Online } from './utils';

const Sources = async (
  schema: Schema,
  memory: Memory,
  keyMap: KeyMap,
  auth: Auth,
  setUser: (id: string) => void,
  setCompleted: (valud: number) => void
) => {
  const bucket: Bucket = new IndexedDBBucket({
    namespace: 'transcriber-bucket',
  }) as any;

  const backup = new IndexedDBSource({
    schema,
    keyMap,
    name: 'backup',
    namespace: 'transcriber',
  });

  const tokenPart = auth.accessToken ? auth.accessToken.split('.') : [];
  const tokData = JSON.parse(
    tokenPart.length > 1 ? Base64.decode(tokenPart[1]) : '{"sub":""}'
  );
  const userToken = localStorage.getItem('user-token');

  await backup
    .pull(q => q.findRecords())
    .then(transform => memory.sync(transform));

  let remote: JSONAPISource = {} as JSONAPISource;

  if (!API_CONFIG.offline) {
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
  }

  const coordinator = new Coordinator();
  await coordinator.addSource(memory);
  await coordinator.addSource(backup);

  if (!API_CONFIG.offline) {
    await coordinator.addSource(remote);
  }

  // Update indexedDb when memory updated
  // TODO: error if we can't read and write the indexedDB
  await coordinator.addStrategy(
    new SyncStrategy({
      source: 'memory',
      target: 'backup',
      blocking: true,
    })
  );

  if (!API_CONFIG.offline) {
    // Query the remote server whenever the memory is queried
    await coordinator.addStrategy(
      new RequestStrategy({
        name: 'remote-request',

        source: 'memory',
        on: 'beforeQuery',

        target: 'remote',
        action: 'pull',

        blocking: false,
      })
    );

    // Update the remote server whenever the memory is updated
    await coordinator.addStrategy(
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
    await coordinator.addStrategy(
      new SyncStrategy({
        name: 'remote-sync',

        source: 'remote',
        target: 'memory',

        blocking: true,
      })
    );
  }

  await coordinator.addStrategy(new EventLoggingStrategy());

  await coordinator.activate({ logLevel: LogLevel.Warnings }).then(() => {
    console.log('Coordinator will log warnings');
    if (API_CONFIG.offline) {
      memory
        .query(q => q.findRecords('user'))
        .then((u: Array<User>) => {
          u = u.filter(u1 => u1.attributes && u1.attributes.name);
          if (u.length === 1) {
            setUser(u[0].id);
          }
        });
    } else if (userToken === tokData.sub) {
      setUser(localStorage.getItem('user-id') as string);
    }
  });

  if (!API_CONFIG.offline && userToken !== tokData.sub) {
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
      .then(() => setCompleted(10));
    await remote
      .pull(q => q.findRecords('organizationmembership'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(15));
    await remote
      .pull(q => q.findRecords('project'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(20));
    await remote
      .pull(q => q.findRecords('integration'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(25));
    await remote
      .pull(q => q.findRecords('invitation'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(30));
    await remote
      .pull(q => q.findRecords('projectintegration'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(35));
    await remote
      .pull(q => q.findRecords('projecttype'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(40));
    await remote
      .pull(q => q.findRecords('plan'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(45));
    await remote
      .pull(q => q.findRecords('plantype'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(50));
    await remote
      .pull(q => q.findRecords('section'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(55));
    await remote
      .pull(q => q.findRecords('passagesection'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(60));
    await remote
      .pull(q => q.findRecords('passage'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(65));
    await remote
      .pull(q => q.findRecords('userpassage'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(70));
    await remote
      .pull(q => q.findRecords('group'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(75));
    await remote
      .pull(q => q.findRecords('groupmembership'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(80));
    await remote
      .pull(q => q.findRecords('role'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(85));
    await remote
      .pull(q => q.findRecords('mediafile'))
      .then(transform => memory.sync(transform))
      .then(() => setCompleted(90));
    await remote
      .pull(q => q.findRecords('activitystate'))
      .then(transform => {
        memory.sync(transform);
        if (tokData.sub !== '') {
          localStorage.setItem('user-token', tokData.sub);
        }
      })
      .then(() => setCompleted(95));
  }

  setCompleted(100);
};

export default Sources;
