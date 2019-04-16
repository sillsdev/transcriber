import Coordinator, { RequestStrategy, SyncStrategy } from "@orbit/coordinator";
import IndexedDBSource from "@orbit/indexeddb";
import JSONAPISource from '@orbit/jsonapi';
import { Schema, KeyMap } from "@orbit/data";
import Store from "@orbit/store";

function Sources(schema: Schema, store: Store, keyMap: KeyMap): Promise<any> {
    const backup = new IndexedDBSource({
        schema,
        keyMap,
        name: "backup",
        namespace: "transcriber"
    });
	
    const remote = new JSONAPISource({
        schema,
        keyMap,
        name: 'remote',
        namespace: 'api',
        host: 'https://26nj47s4eh.execute-api.us-east-2.amazonaws.com/qa',
    })
    remote.serializer.resourceKey = () => { return 'remoteId' };

    const coordinator = new Coordinator({
        sources: [store, backup, remote]
    });

    // Update indexedDb when store updated
    coordinator.addStrategy(new SyncStrategy({
        source: "store",
        target: "backup",
        blocking: true
    }));

    // Query the remote server whenever the store is queried
    coordinator.addStrategy(new RequestStrategy({
        source: 'store',
        on: 'beforeQuery',

        target: 'remote',
        action: 'pull',

        blocking: false
    }));

    // Update the remote server whenever the store is updated
    coordinator.addStrategy(new RequestStrategy({
        source: 'store',
        on: 'beforeUpdate',

        target: 'remote',
        action: 'push',

        blocking: false
    }));

    // Sync all changes received from the remote server to the store
    coordinator.addStrategy(new SyncStrategy({
        source: 'remote',
        target: 'store',
        blocking: false
    }));

    remote.pull(q => q.findRecords('organization'))
        .then(transform => store.sync(transform));
    remote.pull(q => q.findRecords('user'))
        .then(transform => store.sync(transform));
    remote.pull(q => q.findRecords('project'))
        .then(transform => store.sync(transform));
    remote.pull(q => q.findRecords('role'))
        .then(transform => store.sync(transform));
    remote.pull(q => q.findRecords('integration'))
        .then(transform => store.sync(transform));
    remote.pull(q => q.findRecords('projectintegration'))
        .then(transform => store.sync(transform));
    remote.pull(q => q.findRecords('projecttype'))
        .then(transform => store.sync(transform));

    return (backup.pull(q => q.findRecords())
        .then(transform => store.sync(transform))
        .then(() => coordinator.activate()));
    // await remote
    //     .pull(q => q.findRecords('book'))
    //     .then(transform => {
    //         store.sync(transform);
    //         backup.sync(transform);
    //     })
    // await remote
    //     .pull(q => q.findRecords('booktype'))
    //     .then(transform => {
    //         store.sync(transform);
    //         backup.sync(transform);
    //     })
    // await remote
    //     .pull(q => q.findRecords('organization'))
    //     .then(transform => {
    //         store.sync(transform);
    //         backup.sync(transform);
    //     })
    // await remote
    //     .pull(q => q.findRecords('project'))
    //     .then(transform => {
    //         store.sync(transform);
    //         backup.sync(transform);
    //     })
    // await remote
    //     .pull(q => q.findRecords('projecttype'))
    //     .then(transform => {
    //         store.sync(transform);
    //         backup.sync(transform);
    //     })
    // await remote
    //     .pull(q => q.findRecords('role'))
    //     .then(transform => {
    //         store.sync(transform);
    //         backup.sync(transform);
    //     })
    // await remote
    //     .pull(q => q.findRecords('set'))
    //     .then(transform => {
    //         store.sync(transform);
    //         backup.sync(transform);
    //     })
    // await remote
    //     .pull(q => q.findRecords('task'))
    //     .then(transform => {
    //         store.sync(transform);
    //         backup.sync(transform);
    //     })
    // await remote
    //     .pull(q => q.findRecords('taskmedia'))
    //     .then(transform => {
    //         store.sync(transform);
    //         backup.sync(transform);
    //     })
    // await remote
    //     .pull(q => q.findRecords('user'))
    //     .then(transform => {
    //         store.sync(transform);
    //         backup.sync(transform);
    //     })
    // await remote
    //     .pull(q => q.findRecords('userrole'))
    //     .then(transform => {
    //         store.sync(transform);
    //         backup.sync(transform);
    //     })
    // await remote
    //     .pull(q => q.findRecords('usertask'))
    //     .then(transform => {
    //         store.sync(transform);
    //         backup.sync(transform);
    //     })

};

export default Sources;
