import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import ErrorBoundary from './hoc/ErrorBoundary';
import { Router, HashRouter } from 'react-router-dom';
import { DataProvider } from './mods/react-orbitjs';
import { Provider } from 'react-redux';
import Memory from '@orbit/memory';
import { schema, keyMap } from './schema';
import configureStore from './store';
import { setGlobal } from 'reactn';
import bugsnag from '@bugsnag/js';
import bugsnagReact from '@bugsnag/plugin-react';
import history from './history';
import IndexedDBSource from '@orbit/indexeddb';
import { logError, Severity } from './components/logErrorService';
import { infoMsg } from './utils';
import { API_CONFIG } from './api-variable';
const appVersion = require('../package.json').version;

const isElectron = process.env.REACT_APP_MODE === 'electron';

const prodOrQa = API_CONFIG.snagId !== '' && !isElectron;
const adminEndpoint = process.env.REACT_APP_ADMIN_ENDPOINT;
const prod = adminEndpoint && adminEndpoint.indexOf('admin.') !== -1;
const bugsnagClient = prodOrQa
  ? bugsnag({
      apiKey: API_CONFIG.snagId,
      appVersion,
      releaseStage: prod ? 'production' : 'staging',
    })
  : undefined;
bugsnagClient?.use(bugsnagReact, React);
const SnagBoundary = bugsnagClient?.getPlugin('react');

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

if (isElectron) {
  localStorage.removeItem('user-id');
  backup
    .pull((q) => q.findRecords())
    .then((transform) => {
      memory
        .sync(transform)
        .then(() => {
          console.log('done');
        })
        .catch(async () => {
          await backup.reset();
          console.log('reset');
        });
    })
    .catch((err) =>
      logError(
        Severity.error,
        bugsnagClient,
        infoMsg(err, 'IndexedDB Pull error')
      )
    );
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
  doSave: false,
  changed: false,
  importexportBusy: false,
  autoOpenAddMedia: false,
  editUserId: null,
  developer: false,
  offline: isElectron,
  errorReporter: bugsnagClient,
});

if (isElectron) {
  console.log(`Running in Electron: Filesystem access is enabled.`);
} else {
  console.log('Running on the Web, Filesystem access disabled.');
}

const errorManagedApp = bugsnagClient ? (
  <SnagBoundary>
    <ErrorBoundary errorReporter={bugsnagClient}>
      <App />
    </ErrorBoundary>
  </SnagBoundary>
) : (
  <ErrorBoundary errorReporter={bugsnagClient}>
    <App />
  </ErrorBoundary>
);

const router = isElectron ? (
  <HashRouter>{errorManagedApp}</HashRouter>
) : (
  <Router history={history}>{errorManagedApp}</Router>
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
