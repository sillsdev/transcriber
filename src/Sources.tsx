import { useGlobal } from 'reactn';
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
import Online from './components/OnLineStatus';

function Sources(
  schema: Schema,
  store: Store,
  keyMap: KeyMap,
  auth: Auth
): Promise<any> {
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [_user, setUser] = useGlobal('user');
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [_initials, setInitials] = useGlobal('initials');

  const backup = new IndexedDBSource({
    schema,
    keyMap,
    name: 'backup',
    namespace: 'transcriber',
  });

  if (Online() && !API_CONFIG.offline) {
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

  const userSetup = (user: User) => {
    setUser(user.id);
    setInitials(
      user.attributes.name
        .trim()
        .split(' ')
        .map((s: string) => s.slice(0, 1).toLocaleUpperCase())
        .join('')
    );
  };

  if (!API_CONFIG.offline) {
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
        userSetup(user);
      });
    remote
      .pull(q => q.findRecords('user'))
      .then(transform => store.sync(transform));
    remote
      .pull(q => q.findRecords('organization'))
      .then(transform => store.sync(transform));
    remote
      .pull(q => q.findRecords('organizationmembership'))
      .then(transform => store.sync(transform));
    remote
      .pull(q => q.findRecords('project'))
      .then(transform => store.sync(transform));
    remote
      .pull(q => q.findRecords('integration'))
      .then(transform => store.sync(transform));
    remote
      .pull(q => q.findRecords('projectintegration'))
      .then(transform => store.sync(transform));
    remote
      .pull(q => q.findRecords('projecttype'))
      .then(transform => store.sync(transform));
    remote
      .pull(q => q.findRecords('plan'))
      .then(transform => store.sync(transform));
    remote
      .pull(q => q.findRecords('plantype'))
      .then(transform => store.sync(transform));
    remote
      .pull(q => q.findRecords('section'))
      .then(transform => store.sync(transform));
    remote
      .pull(q => q.findRecords('passagesection'))
      .then(transform => store.sync(transform));
    remote
      .pull(q => q.findRecords('passage'))
      .then(transform => store.sync(transform));
    remote
      .pull(q => q.findRecords('userrole'))
      .then(transform => store.sync(transform));
    remote
      .pull(q => q.findRecords('userpassage'))
      .then(transform => store.sync(transform));
    remote
      .pull(q => q.findRecords('group'))
      .then(transform => store.sync(transform));
    remote
      .pull(q => q.findRecords('groupmembership'))
      .then(transform => store.sync(transform));
    remote
      .pull(q => q.findRecords('role'))
      .then(transform => store.sync(transform));
    remote
      .pull(q => q.findRecords('mediafile'))
      .then(transform => store.sync(transform));
    remote
      .pull(q => q.findRecords('activitystate'))
      .then(transform => store.sync(transform));
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
                userSetup(u[0]);
              }
            });
        }
      })
    );
}

export default Sources;
