import * as React from 'react';
import { Router, Route } from 'react-router-dom';
import { setGlobal } from 'reactn';
import { DataProvider } from 'react-orbitjs';
import { Provider } from 'react-redux';
import store from './store';
import Access from './routes/Access';
import Logout from './routes/Logout';
import Drawer from './routes/drawer';
import Loading from './routes/Loading';
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
};

const dataStore = new Store({ schema, keyMap });

setGlobal({
  organization: null,
  project: null,
  plan: null,
  tab: 0,
  group: null,
  user: null,
  initials: null,
  lang: 'en',
  dataStore: dataStore,
  schema: schema,
  keyMap: keyMap,
});

interface IProps {
  history?: {
    location: {
      pathname: string;
    };
  };
}

export class App extends React.Component<IProps, any> {
  public constructor(props: IProps) {
    super(props);
  }

  // async componentDidMount() {
  //   if (history.location && history.location.pathname === '/callback') return;
  //   try {
  //     await auth.renewSession();
  //     this.forceUpdate();
  //   } catch (err) {
  //     if (err.error !== 'login_required') console.log(err.error);
  //   }
  // }

  public render() {
    return (
      <DataProvider dataStore={dataStore}>
        <Provider store={store}>
          <Router history={history}>
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
          </Router>
        </Provider>
      </DataProvider>
    );
  }
}

export default App;
