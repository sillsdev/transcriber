import * as React from 'react';
import { Router, Route } from 'react-router-dom';
import { setGlobal } from 'reactn';
import { DataProvider } from 'react-orbitjs';
import { Provider } from 'react-redux';
import store from './store';
import blue from '@material-ui/core/colors/blue';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import { yellow } from '@material-ui/core/colors';
import Access from './Access';
import Welcome from './Welcome';
import AdminPanel from './AdminPanel';
import CreateOrg from './CreateOrg';
import OrganizationTable from './OrganizationTable';
import ProjectTable from './ProjectTable';
import UserTable from './UserTable';
import ProjectStatus from './ProjectStatus';
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
}

const theme = createMuiTheme({
  palette: {
    primary: blue,
    secondary: yellow,
  },
});

const dataStore = new Store({ schema, keyMap });

setGlobal({
  organization: null,
  project: null,
  user: null,
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
          <MuiThemeProvider theme={theme}>
            <Route path='/' exact={true} render={(props) => <Access auth={auth} {...props} />} />
            <Route path='/welcome' render={(props) => <Welcome auth={auth} {...props} />} />
            <Route path='/admin' render={(props) => <AdminPanel auth={auth} {...props} />} />
            <Route path='/neworg' render={(props) => <CreateOrg auth={auth} {...props} />} />
            <Route path='/organization' render={(props) => <OrganizationTable auth={auth} {...props} />} />
            <Route path='/project' render={(props) => <ProjectTable auth={auth} {...props} />} />
            <Route path='/projectstatus' render={(props) => <ProjectStatus auth={auth} {...props} />} />
            <Route path='/user' render={(props) => <UserTable auth={auth} {...props} />} />
            <Route path="/callback" render={(props) => {
              handleAuthentication(props);
              return <Callback {...props} /> 
            }}/>
          </MuiThemeProvider>
        </Router>
      </Provider>
    </DataProvider>
  );
}

export default App;
