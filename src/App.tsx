import * as React from 'react';
import { hot } from 'react-hot-loader';
import { Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@material-ui/core';
import Logout from './routes/Logout';
import Loading from './routes/Loading';
import Profile from './routes/Profile';
import TeamScreen from './routes/TeamScreen';
import PlanScreen from './routes/PlanScreen';
import WorkScreen from './routes/WorkScreen';
import Buggy from './routes/Buggy';
import EmailUnverified from './routes/EmailUnverified';
import { TokenProvider } from './context/TokenProvider';
import PrivateRoute from './hoc/PrivateRoute';
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
import PassageDetail from './routes/PassageDetail';
export const HeadHeight = 64;

const handleParameters = (props: any) => {
  const { location } = props;

  if (location.search !== '') {
    const params = parseQuery(location.search);
    if (params.inviteId && typeof params.inviteId === 'string') {
      localStorage.setItem('inviteId', params.inviteId);
    }
  }
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#135CB9',
    },
    secondary: {
      main: '#00A7E1',
    },
  },
});

function App() {
  return (
    <TokenProvider>
      <UnsavedProvider>
        <DataChanges>
          <SnackBarProvider>
            <HotKeyProvider>
              <ThemeProvider theme={theme}>
                <Route
                  path="/"
                  exact={true}
                  render={(props) => {
                    handleParameters(props);
                    return <Welcome {...props} />;
                  }}
                />
                <Route
                  path="/access/:users"
                  render={(props) => {
                    return <Access {...props} />;
                  }}
                />
                <Route path="/error" exact render={(props) => <Buggy />} />
                <Route
                  path="/emailunverified"
                  exact={true}
                  render={(props) => <EmailUnverified {...props} />}
                />
                <Route
                  path="/logout"
                  exact={true}
                  render={(props) => <Logout {...props} />}
                />
                <Route
                  path="/terms"
                  render={() => <HTMLPage text={termsContent} />}
                />
                <Route
                  path="/privacy"
                  render={() => <HTMLPage text={privacyContent} />}
                />
                <PrivateRoute path="/loading">
                  <Loading />
                </PrivateRoute>
                <PrivateRoute path="/profile">
                  <Profile />
                </PrivateRoute>
                <PrivateRoute path="/team">
                  <TeamScreen />
                </PrivateRoute>
                <PrivateRoute path="/plan/:prjId/:tabNm">
                  <PlanScreen />
                </PrivateRoute>
                <PrivateRoute exact path="/work/:prjId/:pasId">
                  <WorkScreen />
                </PrivateRoute>
                <PrivateRoute exact path="/work/:prjId/:pasId/:slug/:medId">
                  <WorkScreen />
                </PrivateRoute>
                <PrivateRoute exact path="/work/:prjId">
                  <WorkScreen />
                </PrivateRoute>
                <PrivateRoute exact path="/detail/:prjId/:pasId">
                  <PassageDetail />
                </PrivateRoute>
                <PrivateRoute exact path="/detail/:prjId/:pasId/:mediaId">
                  <PassageDetail />
                </PrivateRoute>
              </ThemeProvider>
            </HotKeyProvider>
          </SnackBarProvider>
        </DataChanges>
      </UnsavedProvider>
    </TokenProvider>
  );
}

export default hot(module)(App);
