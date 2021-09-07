import * as React from 'react';
import { useGlobal } from 'reactn';
import { useAuth0 } from '@auth0/auth0-react';
import JwtDecode from 'jwt-decode';
import { IToken } from './model';
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
import Busy from './components/Busy';
import EmailUnverified from './routes/EmailUnverified';
import { logError, Severity } from './utils';
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
import { HTMLPage } from './components/HTMLPage';
import { termsContent } from './routes/TermsContent';
import { privacyContent } from './routes/privacyContent';
import { isElectron } from './api-variable';

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

function App() {
  const { isLoading, isAuthenticated, error, user, getAccessTokenSilently } =
    useAuth0();
  const [errorReporter] = useGlobal('errorReporter');

  React.useEffect(() => {
    (async () => {
      if (isAuthenticated) {
        const token = await getAccessTokenSilently();
        const decodedToken = JwtDecode(token) as IToken;
        auth.setAuthSession(user, token, decodedToken.exp);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (isLoading && !isElectron) {
    return <Busy />;
  }

  if (error && !isElectron) {
    console.log(error);
    if (errorReporter) logError(Severity.error, errorReporter, error);
    return <Busy />;
  }

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
                  render={(props) => <EmailUnverified auth={auth} {...props} />}
                />
                <Route
                  path="/logout"
                  exact={true}
                  render={(props) => <Logout auth={auth} {...props} />}
                />
                <Route
                  path="/terms"
                  render={() => <HTMLPage text={termsContent} />}
                />
                <Route
                  path="/privacy"
                  render={() => <HTMLPage text={privacyContent} />}
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
                <Route path="/neworg" render={(props) => handleNewOrg(props)} />
              </ThemeProvider>
            </HotKeyProvider>
          </UnsavedProvider>
        </SnackBarProvider>
      </DataChanges>
    </TokenCheck>
  );
}

export default hot(module)(App);
