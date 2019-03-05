import * as React from 'react';
import './App.scss';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import DevTools from '../DevTool';
import TaskTable from '../connect/TaskTable';
import AdminPanel from '../connect/AdminPanel';
import Welcome from '../connect/Welcome';
import Drawer from './Drawer';
import Login from './Login';
import { Provider } from 'react-redux';
import store from '../store';
import { DataProvider } from 'react-orbitjs';
import { Record, Schema } from '@orbit/data';
import Store from '@orbit/store';
import SchemaObject from '../model/orbitSchema'
import blue from '@material-ui/core/colors/blue';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import { pink } from '@material-ui/core/colors';

const schema = new Schema(SchemaObject);

const dataStore = new Store({ schema });

const theme = createMuiTheme({
  palette: {
    primary: blue,
    secondary: pink,
  }
})

const user = {
  type: 'user',
  id: 'admin',
  attributes: {
    fullName: 'Admin',
    avatarUri: '/api/tommy.png'
  }
} as Record;

class App extends React.Component {
  public render() {
    dataStore.update( t => [
      t.addRecord(user)
    ])

    return (
      <DataProvider dataStore={dataStore}>
        <Provider store={store}>
          <Router>
            <MuiThemeProvider theme={theme}>
              <Route path='/' exact={true} component={Login} />
              <Route path='/login' component={Login} />
              <Route path='/main' component={Welcome} />
              <Route path='/admin' component={AdminPanel} />
              <Route path='/task' component={TaskTable} />
              <Route path='/main/dashboard' component={Drawer} />
              <Route path='/main/project' component={Drawer} />
              <Route path='/main/task' component={Drawer} />
              <Route path='/main/scheme' component={Drawer} />
              <Route path='/main/backup' component={Drawer} />
              <Route path='/main/user' component={Drawer} />
              <Route path='/' exact={false} component={DevTools} />
            </MuiThemeProvider>
          </Router>
        </Provider>
      </DataProvider>
    );
  }
}

export default App;
