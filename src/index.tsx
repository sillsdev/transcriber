import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { Router } from 'react-router-dom';
import { DataProvider } from 'react-orbitjs';
import { Provider } from 'react-redux';
import Store from '@orbit/store';
import { schema, keyMap } from './schema';
import configureStore from './store';
import { setGlobal } from 'reactn';
import history from './history';

// Redux store
const store = configureStore();

// Orbit store
const dataStore = new Store({ schema, keyMap });

setGlobal({
  organization: '',
  project: '',
  plan: '',
  tab: 0,
  group: '',
  user: '',
  lang: 'en',
  dataStore: dataStore,
  schema: schema,
  keyMap: keyMap,
});

const Root = () => (
  <DataProvider dataStore={dataStore}>
    <Provider store={store as any}>
      <Router history={history}>
        <App />
      </Router>
    </Provider>
  </DataProvider>
);
ReactDOM.render(<Root />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
