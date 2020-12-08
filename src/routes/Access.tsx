import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  IState,
  IAccessStrings,
  User,
  GroupMembership,
  Project,
  Plan,
  Section,
} from '../model';
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
import { related, useOfflnProjRead } from '../crud';
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
  groupMemberships: Array<GroupMembership>;
  projects: Array<Project>;
  plans: Array<Plan>;
  sections: Array<Section>;
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
export const goOnline = () => {
  localStorage.removeItem('auth-id');
  ipc?.invoke('login');
  remote?.getCurrentWindow().close();
};

export function Access(props: IProps) {
  const {
    auth,
    t,
    importStatus,
    users,
    groupMemberships,
    projects,
    plans,
    sections,
  } = props;
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
  const offlineProjRead = useOfflnProjRead();

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

  const handleGoOnline = (event: React.MouseEvent<HTMLElement>) => {
    if (isElectron) {
      if (!event.shiftKey) {
        goOnline();
      } else ipc?.invoke('logout');
    }
  };

  const handleVersionClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      localStorage.setItem('developer', !isDeveloper ? 'true' : 'false');
      setIsDeveloper(!isDeveloper);
    }
  };

  const handleAdmin = () => shell.openExternal(API_CONFIG.endpoint);

  // see: https://web.dev/persistent-storage/
  const persistData = async () => {
    if (navigator?.storage?.persisted) {
      let isPersisted = await navigator.storage.persisted();
      if (!isPersisted && navigator?.storage?.persist) {
        isPersisted = await navigator.storage.persist();
      }
      console.log(`Persisted storage granted: ${isPersisted}`);
    }
  };

  const hasUserProjects = (userId: string) => {
    const grpIds = groupMemberships
      .filter((gm) => related(gm, 'user') === userId)
      .map((gm) => related(gm, 'group'));
    const projIds = projects
      .filter(
        (p) =>
          grpIds.includes(related(p, 'group')) &&
          offlineProjRead(p.id)?.attributes?.offlineAvailable
      )
      .map((p) => p.id);
    const planIds = plans
      .filter((p) => projIds.includes(related(p, 'project')))
      .map((p) => p.id);
    const userSections = sections.filter((s) =>
      planIds.includes(related(s, 'plan'))
    );
    return userSections.length > 0;
  };

  useEffect(() => {
    if (isElectron) persistData();
    setLanguage(localeDefault(isDeveloper));
    fetchLocalization();
    Online((online) => setOnline(online), auth);
    setOrganization('');
    setProject('');
    setPlan('');
    setProjRole('');

    if (!auth?.isAuthenticated()) {
      if (!offline && !isElectron) {
        handleLogin();
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    if (isElectron && selectedUser === '') {
      ipc?.invoke('get-profile').then((result) => {
        if (result) {
          // Even tho async, this executes first b/c users takes time to load
          ipc?.invoke('get-token').then((accessToken) => {
            if (offline) setOffline(false);
            if (auth) auth.setDesktopSession(result, accessToken);
            if (selectedUser === '') setSelectedUser('unknownUser');
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  if (auth?.accessToken && !auth?.emailVerified()) {
    return <Redirect to="/emailunverified" />;
  } else if (
    (!isElectron && auth?.isAuthenticated()) ||
    (isElectron && selectedUser !== '')
  )
    return <Redirect to="/loading" />;

  return (
    <div className={classes.root}>
      <AppBar className={classes.appBar} position="static" color="inherit">
        <>
          <Toolbar>
            <Typography variant="h6" color="inherit" className={classes.grow}>
              {API_CONFIG.productName}
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
                  {reactStringReplace(
                    t.accessFirst.replace('{0}', API_CONFIG.productName),
                    '{1}',
                    () => {
                      return online ? (
                        <Button key="launch" onClick={handleAdmin}>
                          SIL Transcriber
                        </Button>
                      ) : (
                        'SIL Transcriber'
                      );
                    }
                  )}
                </span>
              )}
            </Typography>
            <Grid container direction="row">
              {importStatus?.complete !== false && users && users.length > 0 && (
                <Grid item xs={12} md={6}>
                  <div className={classes.actions}>
                    <List>
                      {users
                        .filter((u) => hasUserProjects(u.id))
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
                  <p> </p>
                  <Button
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={handleGoOnline}
                  >
                    {t.goOnline}
                  </Button>
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
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  plans: (q: QueryBuilder) => q.findRecords('plan'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(Access) as any
) as any;
