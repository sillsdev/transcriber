import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import { Auth0Provider } from '@auth0/auth0-react';
import envVariables from './auth/auth0-variables.json';
import './index.css';
import App from './App';
// import * as serviceWorker from './serviceWorker';
import ErrorBoundary from './hoc/ErrorBoundary';
import { Provider } from 'react-redux';
import { coordinator, memory, backup, schema } from './schema';
import configureStore from './store';
import { setGlobal } from 'reactn';
import Bugsnag from '@bugsnag/js';
import BugsnagReact from '@bugsnag/plugin-react';
import {
  logError,
  Severity,
  infoMsg,
  logFile,
  getFingerprintArray,
  waitForIt,
  LocalKey,
  Online,
} from './utils';
import { updateableFiles, staticFiles, localFiles } from './crud';
import {
  isElectron,
  API_CONFIG,
  OrbitNetworkErrorRetries,
} from './api-variable';
import { RecordQueryBuilder } from '@orbit/records';
import { related } from './crud';
import { Section, Plan } from './model';
import { TokenProvider } from './context/TokenProvider';
import { ErrorFallback } from './components/ErrorFallback';
import DataProvider from './hoc/DataProvider';
import { backupToMemory } from './crud/syncToMemory';
import Coordinator from '@orbit/coordinator';
import MemorySource from '@orbit/memory';
import IndexedDBSource from '@orbit/indexeddb';
const appVersion = require('../package.json').version;
const { auth0Domain, webClientId, apiIdentifier } = envVariables;
const ipc = (window as any)?.electron;

const prodOrQa = API_CONFIG.snagId !== '';
const prod = API_CONFIG.host.indexOf('api.') !== -1;
const bugsnagClient = prodOrQa
  ? Bugsnag.start({
      hostname: API_CONFIG.endpoint,
      apiKey: API_CONFIG.snagId,
      plugins: [new BugsnagReact()],
      appVersion,
      releaseStage: prod ? 'production' : 'staging',
      autoTrackSessions: false,
      endpoints: {
        notify: API_CONFIG.notify,
        sessions: API_CONFIG.sessions,
      },
    })
  : undefined;
Online(true, (result) => {
  if (!result || !Bugsnag.isStarted()) {
    localStorage.setItem(LocalKey.connected, 'false');
  } else {
    localStorage.setItem(LocalKey.connected, 'true');
    Bugsnag.startSession();
  }
});
const SnagBoundary = prodOrQa
  ? Bugsnag.getPlugin('react')?.createErrorBoundary(React)
  : null;

// Redux store
const store = configureStore();

export async function restoreBackup(coordinator?: Coordinator) {
  const myMemory = memory ?? (coordinator?.getSource('memory') as MemorySource);
  const myBackup =
    backup ?? (coordinator?.getSource('backup') as IndexedDBSource);

  try {
    await waitForIt(
      'migration',
      () => {
        // console.log(schema.version, backup.schema.version);
        return schema.version === myBackup.schema.version;
      },
      () => false,
      300
    );
    // TODO: update this code when ugrading to orbit 0.17
    const sortedFiles = updateableFiles
      .concat(staticFiles)
      .concat(localFiles)
      .sort((i, j) => (i.sort <= j.sort ? -1 : 1));
    for (let file of sortedFiles) {
      await backupToMemory({
        table: file.table,
        backup: myBackup,
        memory: myMemory,
      });
    }

    const loadedplans = new Set(
      (
        myMemory.cache.query((q: RecordQueryBuilder) =>
          q.findRecords('section')
        ) as Section[]
      ).map((s) => related(s, 'plan') as string)
    );
    const plans = (
      myMemory.cache.query((q: RecordQueryBuilder) =>
        q.findRecords('plan')
      ) as Plan[]
    ).filter((p) => loadedplans.has(p.id ?? ''));
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

const ErrorManagedApp = () => {
  const [electronLog, setElectronLog] = React.useState('errorReporter');

  useEffect(() => {
    if (isElectron) {
      logFile().then((fullName: string) => {
        localStorage.setItem(LocalKey.errorLog, fullName);
        setElectronLog(fullName);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return bugsnagClient && SnagBoundary ? (
    <SnagBoundary FallbackComponent={ErrorFallback as any}>
      <ErrorBoundary errorReporter={bugsnagClient} memory={memory}>
        <App />
      </ErrorBoundary>
    </SnagBoundary>
  ) : (
    <ErrorBoundary errorReporter={electronLog} memory={memory}>
      <App />
    </ErrorBoundary>
  );
};
const TokenChecked = () => (
  <TokenProvider>
    <ErrorManagedApp />
  </TokenProvider>
);

const AuthApp = () => {
  const onRedirectingCallbck = (appState?: { returnTo?: string }) => {
    //user has requested a specific path
    //remember it to come back to after loading
    if (appState?.returnTo) {
      localStorage.setItem(LocalKey.deeplink, appState.returnTo);
    } else {
      localStorage.removeItem(LocalKey.deeplink);
    }
  };

  return (
    <Auth0Provider
      domain={auth0Domain}
      clientId={webClientId}
      audience={apiIdentifier}
      redirectUri={process.env.REACT_APP_CALLBACK}
      useRefreshTokens={true}
      onRedirectCallback={onRedirectingCallbck}
    >
      <TokenChecked />
    </Auth0Provider>
  );
};

const Root = () => (
  <DataProvider dataStore={memory}>
    <Provider store={store as any}>
      {isElectron ? <TokenChecked /> : <AuthApp />}
    </Provider>
  </DataProvider>
);

// localStorage home used by dataPath to avoid Promise
ipc?.home().then((folder: string) => {
  localStorage.setItem(LocalKey.home, folder);
});

const promises = [];
promises.push(getFingerprintArray());
if (isElectron) {
  console.log('restoring backup in electron in index');
  promises.push(restoreBackup()); //.then(() => console.log('pull done'));
}
Promise.all(promises)
  .then((promResults) => {
    setGlobal({
      home: false,
      organization: '',
      orgRole: undefined,
      project: '',
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
      saveResult: undefined,
      snackMessage: (<></>) as JSX.Element,
      snackAlert: undefined,
      changed: false,
      projectsLoaded: promResults.length > 1 ? promResults[1] : [],
      loadComplete: false,
      importexportBusy: false,
      autoOpenAddMedia: false,
      editUserId: null,
      developer: localStorage.getItem(LocalKey.developer),
      offline: isElectron,
      errorReporter: bugsnagClient,
      alertOpen: false,
      fingerprint: promResults[0][0],
      orbitRetries: OrbitNetworkErrorRetries,
      enableOffsite: false,
      connected: true,
      offlineOnly: false,
      latestVersion: '',
      releaseDate: '',
      progress: 0,
    });
    const root = ReactDOM.createRoot(
      document.getElementById('root') as HTMLElement
    );
    root.render(
      <React.StrictMode>
        <Root />
      </React.StrictMode>
    );
  })
  .catch((err) => {
    logError(Severity.error, bugsnagClient, infoMsg(err, 'Fingerprint failed'));
  });
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
