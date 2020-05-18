import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState, IAccessStrings, User, IElectronImportStrings } from '../model';
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
  LinearProgress,
} from '@material-ui/core';
import Auth from '../auth/Auth';
import { Online } from '../utils';
import { UserAvatar } from '../components/UserAvatar';
import SnackBar from '../components/SnackBar';
import { IAxiosStatus } from '../store/AxiosStatus';
import { QueryBuilder } from '@orbit/data';
import {
  IImportData,
  handleElectronImport,
  getElectronImportData,
} from './ElectronImport';
import { withData } from '../mods/react-orbitjs';
import AdmZip from 'adm-zip';
import Confirm from '../components/AlertDialog';
import { isElectron, API_CONFIG } from '../api-variable';
import { HeadHeight } from './drawer';

const reactStringReplace = require('react-string-replace');

const version = require('../../package.json').version;
const buildDate = require('../buildDate.json').date;

const noop = { openExternal: () => {} };
const { shell } = isElectron ? require('electron') : { shell: noop };

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
    progress: {
      top: `calc(${HeadHeight}px - ${theme.spacing(1)}px)`,
      zIndex: 100,
      width: '100%',
    },
  })
);
interface IRecordProps {
  users: Array<User>;
}

interface IStateProps {
  t: IAccessStrings;
  ei: IElectronImportStrings;
  importStatus: IAxiosStatus | undefined;
}

interface IDispatchProps {
  fetchLocalization: typeof action.fetchLocalization;
  setLanguage: typeof action.setLanguage;
  importProject: typeof action.importProjectToElectron;
  importComplete: typeof action.importComplete;
  orbitError: typeof action.doOrbitError;
}

interface IProps extends IRecordProps, IStateProps, IDispatchProps {
  history: any;
  auth: Auth;
}

export function Access(props: IProps) {
  const { auth, t, ei, importStatus, users } = props;
  const classes = useStyles();
  const {
    fetchLocalization,
    setLanguage,
    importProject,
    importComplete,
    orbitError,
  } = props;
  const [memory] = useGlobal('memory');
  const [backup] = useGlobal('backup');
  const [coordinatorActivated] = useGlobal('coordinatorActivated');
  const [offline, setOffline] = useGlobal('offline');
  const [message, setMessage] = useState(<></>);
  const [confirmAction, setConfirmAction] = useState('');
  const [zipFile, setZipFile] = useState<AdmZip | null>(null);
  const [online, setOnline] = useState(false);
  const handleLogin = () => auth.login();

  const handleSelect = (uId: string) => () => {
    const selected = users.filter((u) => u.id === uId);
    if (selected.length > 0) {
      localStorage.setItem('user-id', selected[0].id);
      setOffline(true);
    }
  };

  const handleResetMessage = () => setMessage(<></>);

  const handleActionConfirmed = () => {
    if (!zipFile) {
      console.log('No zip file yet...');
      setTimeout(() => {
        handleActionConfirmed();
      }, 2000);
    } else
      handleElectronImport(
        memory,
        backup,
        coordinatorActivated,
        zipFile,
        importProject,
        orbitError,
        ei
      );
    setConfirmAction('');
  };
  const handleActionRefused = () => {
    setConfirmAction('');
  };
  const handleImport = () => {
    if (isElectron) {
      var importData: IImportData = getElectronImportData(memory, ei);
      if (importData.errMsg) setMessage(<span>{importData.errMsg}</span>);
      else {
        setZipFile(importData.zip);
        if (importData.warnMsg) {
          setConfirmAction(importData.warnMsg);
        } else {
          //no warning...so set confirmed
          //zip file never got set here
          //handleActionConfirmed();
          handleElectronImport(
            memory,
            backup,
            coordinatorActivated,
            importData.zip,
            importProject,
            orbitError,
            ei
          );
        }
      }
    }
  };
  const handleAdmin = () => shell.openExternal(API_CONFIG.endpoint);

  useEffect(() => {
    Online((isOnline) => setOnline(isOnline), auth);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

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
    Online((online) => setOffline(!online), auth);

    const localAuth =
      !auth || !auth.isAuthenticated(offline)
        ? localStorage.getItem('trAdminAuthResult')
        : null;
    if (localAuth) {
      try {
        auth.setSession(JSON.parse(localAuth));
        auth
          .renewSession()
          .catch(() => localStorage.removeItem('trAdminAuthResult'));
      } catch (error) {
        localStorage.removeItem('trAdminAuthResult');
      }
    }
    if (!auth || !auth.isAuthenticated(offline)) {
      localStorage.removeItem('trAdminAuthResult');
      if (!offline && !isElectron) {
        handleLogin();
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  if (
    (!isElectron && auth && auth.isAuthenticated(offline)) ||
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
        {!importStatus || (
          <AppBar position="fixed" className={classes.progress} color="inherit">
            <LinearProgress variant="indeterminate" />
          </AppBar>
        )}{' '}
      </AppBar>
      {isElectron && (
        <div className={classes.container}>
          <Paper className={classes.paper}>
            <Typography variant="body1" className={classes.dialogHeader}>
              {importStatus ? (
                importStatus.statusMsg +
                (importStatus.errMsg !== '' ? ': ' + importStatus.errMsg : '')
              ) : users.length > 0 ? (
                t.accessSilTranscriber
              ) : (
                <span>
                  {reactStringReplace(t.accessFirst, '{0}', () => {
                    return online ? (
                      <Button key="launch" onClick={handleAdmin}>
                        SIL Transcriber
                      </Button>
                    ) : (
                      'SIL Transcriber'
                    );
                  })}
                </span>
              )}
            </Typography>
            <Grid container direction="row">
              {!importStatus && users && users.length > 0 && (
                <Grid item xs={12} md={6}>
                  <div className={classes.actions}>
                    <List>
                      {users
                        .sort((i, j) =>
                          (i.attributes ? i.attributes.name : '') <
                          (j.attributes ? j.attributes.name : '')
                            ? -1
                            : 1
                        )
                        .map((u) => (
                          <ListItem key={u.id} onClick={handleSelect(u.id)}>
                            <ListItemIcon>
                              <UserAvatar
                                {...props}
                                users={users}
                                userRec={u}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={u.attributes ? u.attributes.name : ''}
                            />
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
                    onClick={handleImport}
                  >
                    {t.importProject}
                  </Button>
                </div>
              </Grid>
            </Grid>
            {/* <Typography>{'Paratext Path: ' + ptPath}</Typography> */}
          </Paper>
          {confirmAction === '' || (
            <Confirm
              text={confirmAction + '  Continue?'}
              yesResponse={handleActionConfirmed}
              noResponse={handleActionRefused}
            />
          )}
          <SnackBar message={message} reset={handleResetMessage} />
        </div>
      )}
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'access' }),
  ei: localStrings(state, { layout: 'electronImport' }),
  importStatus: state.importexport.importexportStatus,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchLocalization: action.fetchLocalization,
      setLanguage: action.setLanguage,
      importProject: action.importProjectToElectron,
      importComplete: action.importComplete,
      orbitError: action.doOrbitError,
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
