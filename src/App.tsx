import * as React from 'react';
import { Route } from 'react-router-dom';
import Access from './routes/Access';
import Logout from './routes/Logout';
import Drawer from './routes/drawer';
import Loading from './routes/Loading';
import Callback from './callback/Callback';
import Auth from './auth/Auth';

const auth = new Auth();

const handleAuthentication = (props: any) => {
  const { location } = props;
  if (/access_token|id_token|error/.test(location.hash)) {
    auth.handleAuthentication();
  }
};

class App extends React.Component {
  render() {
    return (
      <>
        <Route
          path="/"
          exact={true}
          render={props => <Access auth={auth} {...props} />}
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
          path="/callback"
          render={props => {
            handleAuthentication(props);
            return <Callback {...props} />;
          }}
        />
      </>
    );
  }
}

export default App;
