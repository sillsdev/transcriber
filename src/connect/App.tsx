import * as React from 'react';
import './App.scss';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import DevTools from '../DevTool';
import AppBar from '../present/AppBar';
import Drawer from './Drawer';
import Login from './Login';
import { Provider } from 'react-redux';
import store from '../store';
import blue from '@material-ui/core/colors/blue';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import { pink } from '@material-ui/core/colors';

const theme = createMuiTheme({
  palette: {
    primary: blue,
    secondary: pink,
  }
})
class App extends React.Component {
  public render() {
    return (
      <Provider store={store}>
        <Router>
          <MuiThemeProvider theme={theme}>
            <Route path='/' component={AppBar} />
            <Route path='/login' component={Login} />
            <Route path='/main' component={Drawer} />
            <Route path='/main/dashboard' component={Drawer} />
            <Route path='/main/project' component={Drawer} />
            <Route path='/main/task' component={Drawer} />
            <Route path='/main/scheme' component={Drawer} />
            <Route path='/main/backup' component={Drawer} />
            <Route path='/main/user' component={Drawer} />
            <Route path='/' component={DevTools} />
          </MuiThemeProvider>
        </Router>
      </Provider>
    );
  }
}

export default App;
