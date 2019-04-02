import * as React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { setGlobal } from 'reactn';
import blue from '@material-ui/core/colors/blue';
import { createMuiTheme, MuiThemeProvider, Theme } from '@material-ui/core';
import { yellow } from '@material-ui/core/colors';
import Access from './Access';
import Welcome from './Welcome';
import AdminPanel from './AdminPanel';
import CreateOrg from './CreateOrg';
import OrganizationTable from './OrganizationTable';
import ProjectTable from './ProjectTable';
import UserTable from './UserTable';
import ProjectStatus from './ProjectStatus';


const theme = createMuiTheme({
  palette: {
    primary: blue,
    secondary: yellow,
  },
});

setGlobal({
  organization: null,
  user: null,
});

class App extends React.Component {
  public render() {
    return (
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
          <Route path='/user' component={UserTable} />
        </MuiThemeProvider>
      </Router>
    );
  }
}

export default App;
