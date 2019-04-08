import * as React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
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
import { schema } from './schema';
import Sources from './Sources';


const theme = createMuiTheme({
  palette: {
    primary: blue,
    secondary: yellow,
  },
});

const dataStore = new Store({ schema });
Sources(schema, dataStore);

setGlobal({
  organization: null,
  project: null,
  user: null,
});

class App extends React.Component {
  public render() {
    return (
      <DataProvider dataStore={dataStore}>
        <Provider store={store}>
          <Router>
            <MuiThemeProvider theme={theme}>
              <Route path='/' exact={true} component={Access} />
              <Route path='/access' component={Access} />
              <Route path='/welcome' component={Welcome} />
              <Route path='/admin' component={AdminPanel} />
              <Route path='/neworg' component={CreateOrg} />
              <Route path='/organization' component={OrganizationTable} />
              <Route path='/project' component={ProjectTable} />
              <Route path='/projectstatus' component={ProjectStatus} />
              <Route path='/user' component={UserData} />
            </MuiThemeProvider>
          </Router>
        </Provider>
      </DataProvider>
    );
  }
}

export default App;
