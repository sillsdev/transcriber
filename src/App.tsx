import * as React from 'react';
import { Route, Redirect } from 'react-router-dom';
import Access from './routes/Access';
import Logout from './routes/Logout';
import Drawer from './routes/drawer';
import Loading from './routes/Loading';
import Profile from './routes/Profile';
import Callback from './callback/Callback';
import TokenCheck from './hoc/TokenCheck';
import Auth from './auth/Auth';
import { parseQuery } from './utils/parseQuery';

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

class App extends React.Component {
  render() {
    return (
      <TokenCheck auth={auth}>
        <>
          <Route
            path="/"
            exact={true}
            render={props => {
              handleParameters(props);
              return <Access auth={auth} {...props} />;
            }}
          />
          <Route
            path="/logout"
            exact={true}
            render={props => <Logout auth={auth} {...props} />}
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
            path="/profile"
            render={props => <Profile auth={auth} {...props} />}
          />
          <Route
            path="/callback"
            render={props => {
              handleParameters(props);
              return <Callback {...props} />;
            }}
          />
          <Route path="/neworg" render={props => handleNewOrg(props)} />
        </>
      </TokenCheck>
    );
  }
}

export default App;
