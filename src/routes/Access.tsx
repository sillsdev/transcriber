import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState, IAccessStrings, User } from '../model';
import localStrings from '../selector/localize';
import * as action from '../store';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import Auth from '../auth/Auth';
import { Online } from '../utils';
import { UserAvatar } from '../components/UserAvatar';
import SnackBar from '../components/SnackBar';
import { IAxiosStatus } from '../store/AxiosStatus';
import { QueryBuilder } from '@orbit/data';
import handleElectronImport from './ElectronImport';
import { withData } from 'react-orbitjs';

const version = require('../../package.json').version;
const buildDate = require('../buildDate.json').date;

const isElectron = process.env.REACT_APP_MODE === 'electron';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    grow: {
      flexGrow: 1,
    },
    container: {
      display: 'flex',
      justifyContent: 'center',
    },
    appBar: theme.mixins.gutters({
      display: 'flex',
      flexDirection: 'row',
      boxShadow: 'none',
    }) as any,
    version: {
      alignSelf: 'center',
    },
    paper: theme.mixins.gutters({
      paddingTop: 16,
      paddingBottom: 16,
      marginTop: theme.spacing(3),
      width: '40%',
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center',
      [theme.breakpoints.down('md')]: {
        width: '100%',
      },
    }) as any,
    dialogHeader: theme.mixins.gutters({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
    }) as any,
    actions: theme.mixins.gutters({
      paddingTop: 16,
      paddingBottom: 16,
      marginTop: theme.spacing(2),
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
    }) as any,
    button: {
      marginRight: theme.spacing(1),
    },
  })
);
interface IRecordProps {
  users: Array<User>;
}

interface IStateProps {
  t: IAccessStrings;
  importStatus: IAxiosStatus;
}

interface IDispatchProps {
  fetchLocalization: typeof action.fetchLocalization;
  setLanguage: typeof action.setLanguage;
  importProject: typeof action.importProject;
  importComplete: typeof action.importComplete;
}

interface IProps extends IRecordProps, IStateProps, IDispatchProps {
  history: any;
  auth: Auth;
}

export function Access(props: IProps) {
  const { auth, t, importStatus, users } = props;
  const classes = useStyles();
  const {
    fetchLocalization,
    setLanguage,
    importProject,
    importComplete,
  } = props;
  const [memory] = useGlobal('memory');
  const [offline, setOffline] = useGlobal('offline');
  const [message, setMessage] = useState(<></>);

  const handleLogin = () => auth.login();

  const handleSelect = (uId: string) => () => {
    const selected = users.filter(u => u.id === uId);
    if (selected.length > 0) {
      localStorage.setItem('user-id', selected[0].id);
      setOffline(true);
    }
  };

  const handleResetMessage = () => setMessage(<></>);

  const handleImport = () => {
    if (isElectron) {
      if (
        !handleElectronImport(
          memory,
          importProject,
          t.importPending,
          t.importComplete
        )
      ) {
        setMessage(<span>t.importError</span>);
      }
    }
  };

  useEffect(() => {
    const showMessage = (title: string, msg: string) => {
      setMessage(
        <span>
          {title}
          <br />
          {msg}
        </span>
      );
    };
    if (importStatus) {
      if (importStatus.errStatus) {
        showMessage(t.importError, importStatus.errMsg);
      } else {
        if (importStatus.statusMsg) {
          showMessage(t.importProject, importStatus.statusMsg);
        }
        if (importStatus.complete) {
          importComplete();
        }
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [importStatus]);

  useEffect(() => {
    if (navigator.language.split('-')[0]) {
      setLanguage(navigator.language.split('-')[0]);
    }
    fetchLocalization();
    Online(online => setOffline(!online));

    const localAuth = localStorage.getItem('trAdminAuthResult');
    if (localAuth) {
      try {
        auth.setSession(JSON.parse(localAuth));
      } catch (error) {
        localStorage.removeItem('trAdminAuthResult');
      }
    }
    if (!auth.isAuthenticated(offline)) {
      localStorage.removeItem('trAdminAuthResult');
      if (!offline && !isElectron) {
        handleLogin();
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  if (
    (!isElectron && auth.isAuthenticated(offline)) ||
    (isElectron && localStorage.getItem('user-id') !== null)
  )
    return <Redirect to="/loading" />;

  return (
    <div className={classes.root}>
      <AppBar className={classes.appBar} position="static" color="inherit">
        <Toolbar>
          <Typography variant="h6" color="inherit" className={classes.grow}>
            {process.env.REACT_APP_SITE_TITLE}
          </Typography>
        </Toolbar>
        <div className={classes.grow}>{'\u00A0'}</div>
        <div className={classes.version}>
          {version}
          <br />
          {buildDate}
        </div>
      </AppBar>
      {isElectron && (
        <div className={classes.container}>
          <Paper className={classes.paper}>
            <Typography variant="body1" className={classes.dialogHeader}>
              {t.accessSilTranscriber}
            </Typography>
            <Grid container direction="row">
              {users && users.length > 0 && (
                <Grid item xs={12} md={6}>
                  <div className={classes.actions}>
                    <List>
                      {users
                        .sort((i, j) =>
                          i.attributes.name < j.attributes.name ? -1 : 1
                        )
                        .map(u => (
                          <ListItem key={u.id} onClick={handleSelect(u.id)}>
                            <ListItemIcon>
                              <UserAvatar
                                {...props}
                                users={users}
                                userRec={u}
                              />
                            </ListItemIcon>
                            <ListItemText primary={u.attributes.name} />
                          </ListItem>
                        ))}
                    </List>
                  </div>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <div className={classes.actions}>
                  <Button
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={handleLogin}
                    disabled={offline}
                  >
                    {t.login}
                  </Button>
                </div>
                <div className={classes.actions}>
                  <Button
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={handleImport}
                  >
                    {t.importProject}
                  </Button>
                </div>
              </Grid>
            </Grid>
          </Paper>
          <SnackBar message={message} reset={handleResetMessage} />
        </div>
      )}
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'access' }),
  importStatus: state.importexport.importexportStatus,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchLocalization: action.fetchLocalization,
      setLanguage: action.setLanguage,
      importProject: action.importProject,
      importComplete: action.importComplete,
    },
    dispatch
  ),
});
const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(Access) as any
) as any;
