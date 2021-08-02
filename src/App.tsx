import * as React from 'react';
import { hot } from 'react-hot-loader';
import { Route, Redirect } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@material-ui/core';

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
import PrivateRoute from './hoc/PrivateRoute';
import Auth from './auth/Auth';
import { parseQuery } from './utils/parseQuery';
import DataChanges from './hoc/DataChanges';
import { UnsavedProvider } from './context/UnsavedContext';
import SnackBarProvider from './hoc/SnackBar';
import { HotKeyProvider } from './context/HotKeyContext';
import Access from './routes/Access';
import Welcome from './routes/Welcome';

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
    return true;
  } else {
    return false;
  }
};

const handleNewOrg = (props: any) => {
  const { location } = props;
  if (/neworg|error/.test(location.pathname)) {
    localStorage.setItem('newOrg', location.search);
  }
  return <Redirect to="/loading" />;
};

const theme = createTheme({
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
        <DataChanges auth={auth}>
          <SnackBarProvider>
            <UnsavedProvider>
              <HotKeyProvider>
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
                      return <Welcome auth={auth} {...props} />;
                    }}
                  />
                  <Route
                    path="/access/:users"
                    render={(props) => {
                      return <Access auth={auth} {...props} />;
                    }}
                  />
                  <Route path="/error" exact render={(props) => <Buggy />} />
                  <Route
                    path="/emailunverified"
                    exact={true}
                    render={(props) => (
                      <EmailUnverified auth={auth} {...props} />
                    )}
                  />
                  <Route
                    path="/logout"
                    exact={true}
                    render={(props) => <Logout auth={auth} {...props} />}
                  />
                  <PrivateRoute auth={auth} path="/loading">
                    <Loading auth={auth} />
                  </PrivateRoute>
                  <PrivateRoute auth={auth} path="/profile">
                    <Profile auth={auth} />
                  </PrivateRoute>
                  <PrivateRoute auth={auth} path="/team">
                    <TeamScreen auth={auth} />
                  </PrivateRoute>
                  <PrivateRoute auth={auth} path="/plan/:prjId/:tabNm">
                    <PlanScreen auth={auth} />
                  </PrivateRoute>
                  <PrivateRoute auth={auth} exact path="/work/:prjId/:pasId">
                    <WorkScreen auth={auth} />
                  </PrivateRoute>
                  <PrivateRoute auth={auth} exact path="/work/:prjId">
                    <WorkScreen auth={auth} />
                  </PrivateRoute>
                  <Route
                    path="/callback"
                    render={(props) => {
                      if (!handleParameters(props)) return <Redirect to="/" />;
                      return <Callback {...props} />;
                    }}
                  />
                  <Route
                    path="/neworg"
                    render={(props) => handleNewOrg(props)}
                  />
                </ThemeProvider>
              </HotKeyProvider>
            </UnsavedProvider>
          </SnackBarProvider>
        </DataChanges>
      </TokenCheck>
    );
  }
}

export default hot(module)(App);
