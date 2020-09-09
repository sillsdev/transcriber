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
import { Online, localeDefault } from '../utils';
import { UserAvatar } from '../components/UserAvatar';
import { IAxiosStatus } from '../store/AxiosStatus';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../mods/react-orbitjs';
import { isElectron, API_CONFIG } from '../api-variable';
import ImportTab from '../components/ImportTab';

const reactStringReplace = require('react-string-replace');

const version = require('../../package.json').version;
const buildDate = require('../buildDate.json').date;

const noop = { openExternal: () => {} };
const { shell } = isElectron ? require('electron') : { shell: noop };
const ipc = isElectron ? require('electron').ipcRenderer : null;
const { remote } = isElectron ? require('electron') : { remote: null };

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
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
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
  importStatus: IAxiosStatus | undefined;
}

interface IDispatchProps {
  fetchLocalization: typeof action.fetchLocalization;
  setLanguage: typeof action.setLanguage;
}

interface IProps extends IRecordProps, IStateProps, IDispatchProps {
  auth: Auth;
}

export function Access(props: IProps) {
  const { auth, t, importStatus, users } = props;
  const classes = useStyles();
  const { fetchLocalization, setLanguage } = props;
  const [offline, setOffline] = useGlobal('offline');
  const [isDeveloper, setIsDeveloper] = useGlobal('developer');
  const [importOpen, setImportOpen] = useState(false);
  const [online, setOnline] = useState(false);
  const handleLogin = () => auth.login();
  const [selectedUser, setSelectedUser] = useState('');
  const [, setOrganization] = useGlobal('organization');
  const [, setProject] = useGlobal('project');
  const [, setProjRole] = useGlobal('projRole');
  const [, setPlan] = useGlobal('plan');

  const handleSelect = (uId: string) => () => {
    const selected = users.filter((u) => u.id === uId);
    if (selected.length > 0) {
      localStorage.setItem('user-id', selected[0].id);
      setSelectedUser(uId);
    }
  };

  const handleImport = () => {
    setImportOpen(true);
  };

  const handleGoOnline = () => {
    if (isElectron) {
      ipc?.invoke('login');
      remote?.getCurrentWindow().close();
    }
  };

  const handleVersionClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      setIsDeveloper(!isDeveloper);
    }
  };

  const handleAdmin = () => shell.openExternal(API_CONFIG.endpoint);

  useEffect(() => {
    setLanguage(localeDefault());
    fetchLocalization();
    if (isElectron) {
      Online((online) => setOnline(online), auth);
      setOffline(true);
    } else Online((online) => setOffline(!online), auth);

    setOrganization('');
    setProject('');
    setPlan('');
    setProjRole('');

    if (!auth || !auth.isAuthenticated(offline)) {
      if (!offline && !isElectron) {
        handleLogin();
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    if (isElectron) {
      ipc?.invoke('get-profile').then((result) => {
        if (result) {
          ipc?.invoke('get-token').then((accessToken) => {
            if (auth) auth.setDesktopSession(result, accessToken);
          });
          const sub = result?.sub;
          if (sub) {
            const selected = users.filter((u) => u.attributes.auth0Id === sub);
            if (selected.length > 0) {
              const userId = selected[0].id;
              if (selectedUser !== userId) {
                localStorage.setItem('user-id', userId);
                setSelectedUser(userId);
              }
            }
          }
        }
      });
    }
  });

  if (
    (!isElectron && auth && auth.isAuthenticated(offline)) ||
    (isElectron && (selectedUser !== '' || auth.isAuthenticated(false)))
  )
    return <Redirect to="/loading" />;

  return (
    <div className={classes.root}>
      <AppBar className={classes.appBar} position="static" color="inherit">
        <>
          <Toolbar>
            <Typography variant="h6" color="inherit" className={classes.grow}>
              {process.env.REACT_APP_SITE_TITLE}
            </Typography>
          </Toolbar>
          <div className={classes.grow}>{'\u00A0'}</div>
          <div className={classes.version} onClick={handleVersionClick}>
            {version}
            <br />
            {buildDate}
          </div>
        </>
      </AppBar>
      {isElectron && (
        <div className={classes.container}>
          <Paper className={classes.paper}>
            <Typography variant="body1" className={classes.dialogHeader}>
              {users.length > 0 ? (
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
                  {isDeveloper && (
                    <>
                      <p> </p>
                      <Button
                        variant="contained"
                        color="primary"
                        className={classes.button}
                        onClick={handleGoOnline}
                      >
                        {'Go Online'}
                      </Button>
                    </>
                  )}
                </div>
              </Grid>
            </Grid>
          </Paper>
          {importOpen && (
            <ImportTab auth={auth} isOpen={importOpen} onOpen={setImportOpen} />
          )}
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
