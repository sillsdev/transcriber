import { Base64 } from 'js-base64';
import { User } from './model';
import Coordinator, {
  RequestStrategy,
  SyncStrategy,
  LogLevel,
  EventLoggingStrategy,
} from '@orbit/coordinator';
import IndexedDBSource from '@orbit/indexeddb';
import JSONAPISource from '@orbit/jsonapi';
import { Schema, KeyMap, Transform } from '@orbit/data';
import Store from '@orbit/store';
import Auth from './auth/Auth';
import { API_CONFIG } from './api-variable';
import { Online } from './utils';

function Sources(
  schema: Schema,
  store: Store,
  keyMap: KeyMap,
  auth: Auth,
  setUser: (id: string) => void,
  setCompleted: (valud: number) => void
): Promise<any> {
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

  if (
    Online() &&
    !API_CONFIG.offline &&
    auth.accessToken &&
    userToken !== tokData.sub
  ) {
    backup.reset();
  }

  let remote: JSONAPISource = {} as JSONAPISource;

  if (!API_CONFIG.offline) {
    remote = new JSONAPISource({
      schema,
      keyMap,
      name: 'remote',
      namespace: 'api',
      host: API_CONFIG.host,
      defaultFetchSettings: {
        headers: {
          Authorization: 'Bearer ' + auth.accessToken,
        },
      },
    });
    remote.serializer.resourceKey = () => {
      return 'remoteId';
    };
  }

  const coordinator = new Coordinator();
  coordinator.addSource(store);
  coordinator.addSource(backup);

  if (!API_CONFIG.offline) {
    coordinator.addSource(remote);
  }

  // Update indexedDb when store updated
  coordinator.addStrategy(
    new SyncStrategy({
      source: 'store',
      target: 'backup',
      blocking: true,
    })
  );

  if (!API_CONFIG.offline) {
    // Query the remote server whenever the store is queried
    coordinator.addStrategy(
      new RequestStrategy({
        source: 'store',
        on: 'beforeQuery',

        target: 'remote',
        action: 'pull',

        blocking: false,
      })
    );

    // Update the remote server whenever the store is updated
    coordinator.addStrategy(
      new RequestStrategy({
        source: 'store',
        on: 'beforeUpdate',

        target: 'remote',
        action: 'push',

        blocking: false,
      })
    );

    // Sync all changes received from the remote server to the store
    coordinator.addStrategy(
      new SyncStrategy({
        source: 'remote',
        target: 'store',
        blocking: false,
      })
    );
  }

  coordinator.addStrategy(new EventLoggingStrategy());

  if (!API_CONFIG.offline && userToken !== tokData.sub) {
    remote
      .pull(q => q.findRecords('currentuser'), {
        sources: {
          remote: {
            timeout: 100000,
          },
        },
      })
      .then((transform: Transform[]) => {
        store.sync(transform);
        const user = (transform[0].operations[0] as any).record;
        setUser(user.id);
        localStorage.setItem('user-id', user.id);
      });
    remote
      .pull(q => q.findRecords('user'))
      .then(transform => store.sync(transform))
      .then(() => setCompleted(5));
    remote
      .pull(q => q.findRecords('organization'))
      .then(transform => store.sync(transform))
      .then(() => setCompleted(10));
    remote
      .pull(q => q.findRecords('organizationmembership'))
      .then(transform => store.sync(transform))
      .then(() => setCompleted(15));
    remote
      .pull(q => q.findRecords('project'))
      .then(transform => store.sync(transform))
      .then(() => setCompleted(20));
    remote
      .pull(q => q.findRecords('integration'))
      .then(transform => store.sync(transform))
      .then(() => setCompleted(25));
    remote
      .pull(q => q.findRecords('projectintegration'))
      .then(transform => store.sync(transform))
      .then(() => setCompleted(30));
    remote
      .pull(q => q.findRecords('projecttype'))
      .then(transform => store.sync(transform))
      .then(() => setCompleted(35));
    remote
      .pull(q => q.findRecords('plan'))
      .then(transform => store.sync(transform))
      .then(() => setCompleted(40));
    remote
      .pull(q => q.findRecords('plantype'))
      .then(transform => store.sync(transform))
      .then(() => setCompleted(45));
    remote
      .pull(q => q.findRecords('section'))
      .then(transform => store.sync(transform))
      .then(() => setCompleted(50));
    remote
      .pull(q => q.findRecords('passagesection'))
      .then(transform => store.sync(transform))
      .then(() => setCompleted(55));
    remote
      .pull(q => q.findRecords('passage'))
      .then(transform => store.sync(transform))
      .then(() => setCompleted(60));
    remote
      .pull(q => q.findRecords('userrole'))
      .then(transform => store.sync(transform))
      .then(() => setCompleted(65));
    remote
      .pull(q => q.findRecords('userpassage'))
      .then(transform => store.sync(transform))
      .then(() => setCompleted(70));
    remote
      .pull(q => q.findRecords('group'))
      .then(transform => store.sync(transform))
      .then(() => setCompleted(75));
    remote
      .pull(q => q.findRecords('groupmembership'))
      .then(transform => store.sync(transform))
      .then(() => setCompleted(80));
    remote
      .pull(q => q.findRecords('role'))
      .then(transform => store.sync(transform))
      .then(() => setCompleted(85));
    remote
      .pull(q => q.findRecords('mediafile'))
      .then(transform => store.sync(transform))
      .then(() => setCompleted(90));
    remote
      .pull(q => q.findRecords('activitystate'))
      .then(transform => {
        store.sync(transform);
        if (tokData.sub !== '') {
          localStorage.setItem('user-token', tokData.sub);
        }
      })
      .then(() => setCompleted(95));
  }

  return backup
    .pull(q => q.findRecords())
    .then(transform => store.sync(transform))
    .then(() =>
      coordinator.activate({ logLevel: LogLevel.Warnings }).then(() => {
        console.log('Coordinator will log warnings');
        if (API_CONFIG.offline) {
          store
            .query(q => q.findRecords('user'))
            .then((u: Array<User>) => {
              u = u.filter(u1 => u1.attributes && u1.attributes.name);
              if (u.length === 1) {
                setUser(u[0].id);
                setCompleted(100);
              }
            });
        } else if (userToken === tokData.sub) {
          setUser(localStorage.getItem('user-id') as string);
          setCompleted(95);
        } else {
          setCompleted(80); // This happens before the others and shouldn't show complete
        }
      })
    );
}

export default Sources;
