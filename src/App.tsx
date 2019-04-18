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
import UserData from './UserData';
import ProjectStatus from './ProjectStatus';
import Store from '@orbit/store';
import { schema, keyMap } from './schema';
import Sources from './Sources';
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
Sources(schema, dataStore, keyMap);

setGlobal({
  organization: null,
  project: null,
  user: null,
  lang: 'en',
});

function App() {
  return (
    <DataProvider dataStore={dataStore}>
      <Provider store={store}>
        <Router history={history}>
          <MuiThemeProvider theme={theme}>
            <Route path='/' exact={true} render={(props) => <Access auth={auth} {...props} />} />
            <Route path='/welcome' render={(props) => <Welcome auth={auth} {...props} />} />
            <Route path='/admin' component={AdminPanel} />
            <Route path='/neworg' component={CreateOrg} />
            <Route path='/organization' component={OrganizationTable} />
            <Route path='/project' component={ProjectTable} />
            <Route path='/projectstatus' component={ProjectStatus} />
            <Route path='/user' component={UserData} />
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
