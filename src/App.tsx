import * as React from 'react';
import { hot } from 'react-hot-loader';
import { Route, Redirect } from 'react-router-dom';
import { ThemeProvider, createMuiTheme } from '@material-ui/core';
import Access from './routes/Access';
import Logout from './routes/Logout';
import Loading from './routes/Loading';
import Profile from './routes/Profile';
import TeamScreen from './routes/TeamScreen';
import PlanScreen from './routes/PlanScreen';
import WorkScreen from './routes/WorkScreen';
import Buggy from './routes/Buggy';
import LogoutRequired from './routes/LogoutRequired';
import EmailUnverified from './routes/EmailUnverified';
import Callback from './callback/Callback';
import TokenCheck from './hoc/TokenCheck';
import Auth from './auth/Auth';
import { parseQuery } from './utils/parseQuery';

export const HeadHeight = 64;

const auth = new Auth();

const handleParameters = (props: any) => {
  const { location } = props;

  if (location.search !== '') {
    const params = parseQuery(location.search);
    if (params.inviteId && typeof params.inviteId === 'string') {
      localStorage.setItem('inviteId', params.inviteId);
    }
  }
  if (/access_token|id_token|error/.test(location.hash)) {
    auth.handleAuthentication();
  }
};

const handleNewOrg = (props: any) => {
  const { location } = props;
  if (/neworg|error/.test(location.pathname)) {
    localStorage.setItem('newOrg', location.search);
    const authData = localStorage.getItem('trAdminAuthResult');
    if (authData && typeof authData === 'string') {
      auth.setSession(JSON.parse(authData));
    }
  }
  return <Redirect to="/loading" />;
};

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#005CB9',
    },
    secondary: {
      main: '#00A7E1',
    },
  },
});

class App extends React.Component {
  render() {
    return (
      <TokenCheck auth={auth}>
        <ThemeProvider theme={theme}>
          <Route
            path="/"
            exact={true}
            render={(props) => {
              handleParameters(props);
              if (
                localStorage.getItem('inviteId') &&
                localStorage.getItem('isLoggedIn')
              ) {
                localStorage.removeItem('inviteId');
                return <LogoutRequired />;
              }
              return <Access auth={auth} {...props} />;
            }}
          />
          <Route path="/error" exact render={(props) => <Buggy />} />
          <Route
            path="/emailunverified"
            exact={true}
            render={(props) => <EmailUnverified auth={auth} {...props} />}
          />
          <Route
            path="/logout"
            exact={true}
            render={(props) => <Logout auth={auth} {...props} />}
          />
          <Route
            path="/loading"
            render={(props) => <Loading auth={auth} {...props} />}
          />
          <Route
            path="/profile"
            render={(props) => <Profile auth={auth} {...props} />}
          />
          <Route
            path="/team"
            render={(props) => <TeamScreen auth={auth} {...props} />}
          />
          <Route
            path="/plan"
            render={(props) => <PlanScreen auth={auth} {...props} />}
          />
          <Route
            path="/work"
            render={(props) => <WorkScreen auth={auth} {...props} />}
          />
          <Route
            path="/callback"
            render={(props) => {
              handleParameters(props);
              return <Callback {...props} />;
            }}
          />
          <Route path="/neworg" render={(props) => handleNewOrg(props)} />
        </ThemeProvider>
      </TokenCheck>
    );
  }
}

export default hot(module)(App);
