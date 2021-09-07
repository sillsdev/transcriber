import React from 'react';
import ReactDOM from 'react-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import {
  auth0Domain,
  webClientId,
  apiIdentifier,
} from './auth/auth0-variables.json';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import ErrorBoundary from './hoc/ErrorBoundary';
import { Router, HashRouter } from 'react-router-dom';
import { DataProvider } from './mods/react-orbitjs';
import { Provider } from 'react-redux';
import { coordinator, memory, backup } from './schema';
import configureStore from './store';
import { setGlobal } from 'reactn';
import bugsnag from '@bugsnag/js';
import bugsnagReact from '@bugsnag/plugin-react';
import history from './history';
import {
  logError,
  Severity,
  infoMsg,
  logFile,
  getFingerprintArray,
  hasAuacityScripts,
  hasPython,
  hasAudacity,
} from './utils';
import { isElectron, API_CONFIG } from './api-variable';
import { QueryBuilder } from '@orbit/data';
import { related } from './crud';
import { Section, Plan } from './model';
const appVersion = require('../package.json').version;

export const OrbitNetworkErrorRetries = 5;

const prodOrQa = API_CONFIG.snagId !== '' && !isElectron;
const prod = API_CONFIG.host.indexOf('prod') !== -1;
const bugsnagClient = prodOrQa
  ? bugsnag({
      apiKey: API_CONFIG.snagId,
      appVersion,
      releaseStage: prod ? 'production' : 'staging',
    })
  : undefined;
bugsnagClient?.use(bugsnagReact, React);
const SnagBoundary = bugsnagClient?.getPlugin('react');
const electronLog = isElectron ? logFile() : undefined;

// Redux store
const store = configureStore();

export async function restoreBackup() {
  try {
    await memory.sync(await backup.pull((q) => q.findRecords()));

    const loadedplans = new Set(
      (
        memory.cache.query((q: QueryBuilder) =>
          q.findRecords('section')
        ) as Section[]
      ).map((s) => related(s, 'plan') as string)
    );
    const plans = (
      memory.cache.query((q: QueryBuilder) => q.findRecords('plan')) as Plan[]
    ).filter((p) => loadedplans.has(p.id));
    const projs = new Set(plans.map((p) => related(p, 'project') as string));
    var ret = Array.from(projs);
    return ret;
  } catch (err: any) {
    logError(
      Severity.error,
      bugsnagClient,
      infoMsg(err, 'IndexedDB Pull error')
    );
  }
  return [];
}
if (isElectron) {
  console.log(`Running in Electron: Filesystem access is enabled.`);
} else {
  console.log('Running on the Web, Filesystem access disabled.');
}

const errorManagedApp = bugsnagClient ? (
  <SnagBoundary>
    <ErrorBoundary errorReporter={bugsnagClient} memory={memory}>
      <App />
    </ErrorBoundary>
  </SnagBoundary>
) : (
  <ErrorBoundary errorReporter={electronLog} memory={memory}>
    <App />
  </ErrorBoundary>
);

const onRedirectingCallbck = (appState: { returnTo?: string }) => {
  history.push(
    appState && appState.returnTo ? appState.returnTo : window.location.pathname
  );
};

const router = isElectron ? (
  <HashRouter>{errorManagedApp}</HashRouter>
) : (
  <Auth0Provider
    domain={auth0Domain}
    clientId={webClientId}
    audience={apiIdentifier}
    redirectUri={process.env.REACT_APP_CALLBACK}
    useRefreshTokens={true}
    onRedirectCallback={onRedirectingCallbck}
  >
    <Router history={history}>{errorManagedApp}</Router>
  </Auth0Provider>
);

const Root = () => (
  <DataProvider dataStore={memory}>
    <Provider store={store as any}>{router}</Provider>
  </DataProvider>
);
const promises = [];
promises.push(getFingerprintArray());
const audacity = async () => {
  return [
    (await hasAudacity()) && (await hasAuacityScripts()) && (await hasPython())
      ? 'true'
      : 'false',
  ];
};
if (isElectron) {
  promises.push(restoreBackup()); //.then(() => console.log('pull done'));
  promises.push(audacity());
}
Promise.all(promises)
  .then((promResults) => {
    setGlobal({
      organization: '',
      orgRole: '',
      project: '',
      projRole: '',
      projType: '',
      plan: '',
      tab: undefined,
      group: '',
      user: '',
      lang: 'en',
      coordinator,
      memory,
      remoteBusy: true, //prevent datachanges until after login
      dataChangeCount: 0,
      doSave: false,
      saveResult: undefined,
      snackMessage: (<></>) as JSX.Element,
      snackAlert: undefined,
      changed: false,
      projectsLoaded: promResults.length > 1 ? promResults[1] : [],
      loadComplete: false,
      importexportBusy: false,
      autoOpenAddMedia: false,
      editUserId: null,
      developer: localStorage.getItem('developer'),
      offline: isElectron,
      errorReporter: !isElectron ? bugsnagClient : electronLog,
      alertOpen: false,
      fingerprint: promResults[0][0],
      orbitRetries: OrbitNetworkErrorRetries,
      enableOffsite: false,
      connected: true,
      offlineOnly: false,
      latestVersion: '',
      releaseDate: '',
      progress: 0,
      allAudacity:
        promResults.length > 2 ? promResults[2][0] === 'true' : false,
    });
    ReactDOM.render(<Root />, document.getElementById('root'));
  })
  .catch((err) => {
    logError(Severity.error, bugsnagClient, infoMsg(err, 'Fingerprint failed'));
  });
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
