import React, { PropsWithChildren } from 'react';
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
// import { useNavigate } from 'react-router-dom';
import {
  DataProvider as DataProviderBar,
  DataProviderProps,
} from './mods/react-orbitjs';
import { Provider } from 'react-redux';
import { coordinator, memory, backup, schema } from './schema';
import configureStore from './store';
import { setGlobal } from 'reactn';
import bugsnag from '@bugsnag/js';
import bugsnagReact from '@bugsnag/plugin-react';
import {
  logError,
  Severity,
  infoMsg,
  logFile,
  getFingerprintArray,
  waitForIt,
  LocalKey,
} from './utils';
import { updateableFiles, staticFiles, localFiles } from './crud';
import {
  isElectron,
  API_CONFIG,
  OrbitNetworkErrorRetries,
} from './api-variable';
import { QueryBuilder } from '@orbit/data';
import { related } from './crud';
import { Section, Plan } from './model';
import { TokenProvider } from './context/TokenProvider';
const appVersion = require('../package.json').version;

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
    await waitForIt(
      'migration',
      () => {
        // console.log(schema.version, backup.schema.version);
        return schema.version === backup.schema.version;
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
      await memory.sync(await backup.pull((q) => q.findRecords(file.table)));
    }

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

const ErrorManagedApp = () =>
  bugsnagClient ? (
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

const TokenChecked = () => (
  <TokenProvider>
    <ErrorManagedApp />
  </TokenProvider>
);

const AuthApp = () => {
  // const navigate = useNavigate();

  const onRedirectingCallbck = (appState?: { returnTo?: string }) => {
    // navigate(
    //   appState && appState.returnTo
    //     ? appState.returnTo
    //     : window.location.pathname
    // );
    localStorage.setItem(
      LocalKey.deeplink,
      appState && appState.returnTo
        ? appState.returnTo
        : window.location.pathname
    );
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

const DataProvider = (props: DataProviderProps & PropsWithChildren) => {
  return <DataProviderBar {...props} />;
};

const Root = () => (
  <DataProvider dataStore={memory}>
    <Provider store={store as any}>
      {isElectron ? <TokenChecked /> : <AuthApp />}
    </Provider>
  </DataProvider>
);
const promises = [];
promises.push(getFingerprintArray());
if (isElectron) {
  promises.push(restoreBackup()); //.then(() => console.log('pull done'));
}
Promise.all(promises)
  .then((promResults) => {
    setGlobal({
      organization: '',
      orgRole: undefined,
      project: '',
      projRole: undefined,
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
      trackedTask: '',
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
