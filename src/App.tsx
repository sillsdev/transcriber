import * as React from 'react';
import { Router, Route } from 'react-router-dom';
import { setGlobal } from 'reactn';
import { DataProvider } from 'react-orbitjs';
import { Provider } from 'react-redux';
import store from './store';
import Access from './routes/Access';
import OrganizationTable from './routes/OrganizationTable';
import ProjectTable from './routes/ProjectTable';
import UserTable from './routes/UserTable';
import Drawer from './routes/drawer';
import Loading from './routes/Loading';
import Store from '@orbit/store';
import { schema, keyMap } from './schema';
import Callback from './callback/Callback';
import Auth from './auth/Auth';
import history from './history';

const auth = new Auth();

const handleAuthentication = (props: any) => {
  const { location } = props;
  if (/access_token|id_token|error/.test(location.hash)) {
    auth.handleAuthentication();
  }
};

const dataStore = new Store({ schema, keyMap });

setGlobal({
  organization: null,
  project: null,
  plan: null,
  tab: null,
  user: null,
  initials: null,
  lang: 'en',
  dataStore: dataStore,
  schema: schema,
  keyMap: keyMap,
});

function App() {
  return (
    <DataProvider dataStore={dataStore}>
      <Provider store={store}>
        <Router history={history}>
          <Route
            path="/"
            exact={true}
            render={props => <Access auth={auth} {...props} />}
          />
          <Route
            path="/organization"
            render={props => <OrganizationTable auth={auth} {...props} />}
          />
          <Route
            path="/project"
            render={props => <ProjectTable auth={auth} {...props} />}
          />
          <Route
            path="/user"
            render={props => <UserTable auth={auth} {...props} />}
          />
          <Route
            path="/loading"
            render={props => <Loading auth={auth} {...props} />}
          />
          <Route
            path="/main"
            render={props => <Drawer auth={auth} {...props} />}
          />
          <Route
            path="/callback"
            render={props => {
              handleAuthentication(props);
              return <Callback {...props} />;
            }}
          />
        </Router>
      </Provider>
    </DataProvider>
  );
}

export default App;
