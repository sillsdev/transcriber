import React from 'react';
import './Drawer.css';
import { Route } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Redirect } from 'react-router';
import PropTypes from 'prop-types';
import AppBar from '@material-ui/core/AppBar';
import BackupIcon from '@material-ui/icons/Backup';
import CompareIcon from '@material-ui/icons/CompareArrows';
import CssBaseline from '@material-ui/core/CssBaseline';
import DashboardIcon from '@material-ui/icons/Dashboard';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import ExitIcon from '@material-ui/icons/ExitToApp';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import BookIcon from '@material-ui/icons/Book';
import LanguageIcon from '@material-ui/icons/Language';
import List from '@material-ui/core/List';
import ListIcon from '@material-ui/icons/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuIcon from '@material-ui/icons/Menu';
import PersonIcon from '@material-ui/icons/Person';
import SchemeTable from './SchemeTable';
import TableIcon from '@material-ui/icons/TableChart';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import TranscriberIcon from './transcriber10.png';
import * as action from '../action/userActions';
import FolderList from '../present/FolderList';
import SelectTable from '../present/SelectTable';

const drawerWidth = 240;

const styles = theme => ({
  root: {
    display: 'flex',
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  appBar: {
    marginLeft: drawerWidth,
    [theme.breakpoints.up('sm')]: {
      width: `calc(100% - ${drawerWidth}px)`,
    },
  },
  menuButton: {marginRight: 20,
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  toolbar: theme.mixins.toolbar,
  drawerPaper: {
    width: drawerWidth,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.unit * 3,
  },
});

class ResponsiveDrawer extends React.Component {
  state = {
    mobileOpen: false,
    panel: "",
  };

  handleDrawerToggle = () => {
    this.setState(state => ({ mobileOpen: !state.mobileOpen }));
  };

  handleExit = () => {
    this.props.loginUser({email:""});
  }

  handleListClick = (arg) => {
    this.setState({panel: arg})
  }

  render() {
    const { classes, theme } = this.props;

    switch (this.state.panel) {
      case 'Dashboard': return (<Redirect to='/main/dashboard' />)
      case 'Project': return (<Redirect to='/main/project' />)
      case 'Task': return (<Redirect to='/main/task' />)
      case 'Scheme': return (<Redirect to='/main/scheme' />)
      case 'Backup': return (<Redirect to='/main/backup' />)
      case 'User': return (<Redirect to='/main/user' />)
      default:
    }

    if (!this.props.user || this.props.user === "") {
      return (<Redirect to="/login" />)
    }

    const drawer = (
      <div>
        <div id='AppIcon' className={classes.toolbar}>
          <img src={TranscriberIcon} alt='Transcriber Icon' />
        </div>
        <Divider />
        <List>
          {['Dashboard', 'Project', 'Task', 'Version'].map((text, index) => (
            <ListItem button key={text} onClick={this.handleListClick.bind(this,text)}>
              <ListItemIcon>{index % 4 === 0 ? <DashboardIcon/> : (index %4 === 1 ? <BookIcon /> : (index %4 === 2 ? <ListIcon /> : <CompareIcon />))}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          {['Scheme', 'Backup', 'User', 'Language'].map((text, index) => (
            <ListItem button key={text}  onClick={this.handleListClick.bind(this,text)}>
              <ListItemIcon>{index % 4 === 0 ? <TableIcon/>:(index %4 === 1 ? <BackupIcon /> : (index %4 === 2 ? <PersonIcon /> : <LanguageIcon />))}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
      </div>
    );

    return (
      <div className={classes.root}>
        <CssBaseline />
        <AppBar position="fixed" className={classes.appBar}>
          <Toolbar id='ToolBar'>
            <IconButton
              color="inherit"
              aria-label="Open drawer"
              onClick={this.handleDrawerToggle}
              className={classes.menuButton}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" color="inherit" noWrap>
              Transcriber Admin
            </Typography>
            <IconButton className={classes.IconButton} onClick={this.handleExit} color="inherit" aria-label="Exit">
              <ExitIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <nav className={classes.drawer}>
          {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
          <Hidden smUp implementation="css">
            <Drawer
              container={this.props.container}
              variant="temporary"
              anchor={theme.direction === 'rtl' ? 'right' : 'left'}
              open={this.state.mobileOpen}
              onClose={this.handleDrawerToggle}
              classes={{
                paper: classes.drawerPaper,
              }}
            >
              {drawer}
            </Drawer>
          </Hidden>
          <Hidden xsDown implementation="css">
            <Drawer
              classes={{
                paper: classes.drawerPaper,
              }}
              variant="permanent"
              open
            >
              {drawer}
            </Drawer>
          </Hidden>
        </nav>
        <main className={classes.content}>
          <div id='main-container' className={classes.toolbar} />
          <Route path='/main/dashboard' component={FolderList} />
          <Route path='/main/project' component={SelectTable} />
          <Route path='/main/task' component={SelectTable} />
          <Route path='/main/scheme' component={SchemeTable} />
          <Route path='/main/backup' component={FolderList} />
          <Route path='/main/user' component={FolderList} />
        </main>
      </div>
    );
  }
}

ResponsiveDrawer.propTypes = {
  classes: PropTypes.object.isRequired,
  // Injected by the documentation to work in an iframe.
  // You won't need it on your project.
  container: PropTypes.object,
  theme: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  user: state.user.email,
});

const mapDispatchToProps = (dispatch) => ({
  ...bindActionCreators({
      loginUser: action.loginUser,
  }, dispatch),
});

export default withStyles(styles, { withTheme: true })(connect(mapStateToProps, mapDispatchToProps)(ResponsiveDrawer));
