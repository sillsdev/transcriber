import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import ErrorBoundary from './hoc/ErrorBoundary';
import { Router, HashRouter } from 'react-router-dom';
import { DataProvider } from 'react-orbitjs';
import { Provider } from 'react-redux';
import Memory from '@orbit/memory';
import { schema, keyMap } from './schema';
import configureStore from './store';
import { setGlobal } from 'reactn';
import history from './history';
import IndexedDBSource from '@orbit/indexeddb';

// Redux store
const store = configureStore();

// Orbit store
const memory = new Memory({ schema, keyMap });
const backup = new IndexedDBSource({
  schema,
  keyMap,
  name: 'backup',
  namespace: 'transcriber',
});
const isElectron = process.env.REACT_APP_MODE === 'electron';
if (isElectron) {
  localStorage.removeItem('user-id');
  backup
    .pull(q => q.findRecords())
    .then(transform => {
      memory.sync(transform).then(() => {
        console.log('done');
      });
    })
    .catch(err => console.log('IndexedDB Pull error: ', err));
}
setGlobal({
  organization: '',
  orgRole: '',
  project: '',
  projRole: '',
  plan: '',
  tab: 0,
  group: '',
  user: '',
  lang: 'en',
  memory: memory,
  schema: schema,
  keyMap: keyMap,
  backup: backup,
  bucket: undefined,
  remote: undefined,
  remoteBusy: false,
  autoOpenAddMedia: false,
  editUserId: null,
  developer: false,
  offline: isElectron,
});

if (isElectron) {
  console.log(`Running in Electron: Filesystem access is enabled.`);
} else {
  console.log('Running on the Web, Filesystem access disabled.');
}

const router = isElectron ? (
  <HashRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </HashRouter>
) : (
  <Router history={history}>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </Router>
);

const Root = () => (
  <DataProvider dataStore={memory}>
    <Provider store={store as any}>{router}</Provider>
  </DataProvider>
);
ReactDOM.render(<Root />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
