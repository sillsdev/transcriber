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
  Typography,
  Button,
  Paper,
  FormControlLabel,
  Radio,
  RadioGroup,
  Box,
  FormLabel,
} from '@material-ui/core';
import Auth from '../auth/Auth';
import { Online, localeDefault, forceLogin } from '../utils';
import { related, useOfflnProjRead, useOfflineSetup } from '../crud';
import { IAxiosStatus } from '../store/AxiosStatus';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../mods/react-orbitjs';
import { isElectron } from '../api-variable';
import ImportTab from '../components/ImportTab';
import Confirm from '../components/AlertDialog';
import UserList from '../control/UserList';
import { useSnackBar } from '../hoc/SnackBar';
import AppHead from '../components/App/AppHead';
import { UserListItem } from '../control';
import OfflineIcon from '@material-ui/icons/CloudOff';
import OnlineIcon from '@material-ui/icons/CloudQueue';
const noop = {} as any;
const ipc = isElectron ? require('electron').ipcRenderer : null;
const electronremote = isElectron ? require('@electron/remote') : noop;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'block',
      width: '100%',
    },
    container: {
      display: 'block',
      justifyContent: 'center',
    },
    paper: {
      padding: theme.spacing(3),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transform: 'translateZ(0px)',
      widith: '80%',
    },
    sectionHead: {
      fontSize: '16pt',
      paddingTop: theme.spacing(4),
      paddingBottom: theme.spacing(2),
    },
    actions: {
      paddingTop: theme.spacing(2),
    },
    button: {
      marginRight: theme.spacing(1),
      minWidth: theme.spacing(20),
    },
    formControl: {
      margin: theme.spacing(3),
    },
    box: {
      display: 'flex',
      justifyContent: 'center',
      padding: theme.spacing(3),
      border: 1,
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
  localStorage.setItem('isLoggedIn', 'true');
  ipc?.invoke('login');
  electronremote?.getCurrentWindow().close();
};
export const doLogout = () => {
  localStorage.removeItem('online-user-id');
  forceLogin();
  ipc?.invoke('logout');
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
  const [isDeveloper] = useGlobal('developer');
  const [, setConnected] = useGlobal('connected');
  const [, setEditId] = useGlobal('editUserId');
  const [offlineOnly, setOfflineOnly] = useGlobal('offlineOnly');
  const [importOpen, setImportOpen] = useState(false);
  const handleLogin = () => auth.login();
  const [view, setView] = useState('');
  const [curUser, setCurUser] = useState<User>();
  const [selectedUser, setSelectedUser] = useState('');
  const [, setOrganization] = useGlobal('organization');
  const [, setProject] = useGlobal('project');
  const [, setProjRole] = useGlobal('projRole');
  const [, setProjType] = useGlobal('projType');
  const [, setPlan] = useGlobal('plan');
  const offlineProjRead = useOfflnProjRead();
  const offlineSetup = useOfflineSetup();
  const { showMessage } = useSnackBar();
  const [whichUsers, setWhichUsers] = useState('online');
  const [goOnlineConfirmation, setGoOnlineConfirmation] =
    useState<React.MouseEvent<HTMLElement>>();

  const handleSelect = (uId: string) => {
    const selected = users.filter((u) => u.id === uId);
    if (selected.length > 0) {
      if (selected[0]?.keys?.remoteId === undefined) setOfflineOnly(true);
      setOffline(true);
      auth.logout();
      localStorage.setItem('user-id', selected[0].id);
      setSelectedUser(uId);
    }
  };

  const handleImport = () => {
    setImportOpen(true);
  };

  const handleGoOnline = () => {
    Online(
      (online) => {
        if (online) {
          //setGoOnlineConfirmation(event);
          handleGoOnlineConfirmed();
        } else {
          showMessage(t.mustBeOnline);
        }
      },
      auth,
      true
    );
  };
  const handleGoOnlineConfirmed = () => {
    if (isElectron) {
      if (!goOnlineConfirmation?.shiftKey) {
        goOnline();
      } else ipc?.invoke('logout');
    }
    setGoOnlineConfirmation(undefined);
  };
  const handleGoOnlineRefused = () => {
    setGoOnlineConfirmation(undefined);
  };

  const handleCreateUser = async () => {
    setOffline(true);
    auth.logout();
    await offlineSetup();
    setOfflineOnly(true);
    setEditId('Add');
  };

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

  const isOnlineUserWithOfflineProjects = (userId: string) => {
    const userRec = users.filter((u) => u.id === userId);
    if (userRec.length === 0 || userRec[0]?.keys?.remoteId === undefined)
      return false;
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

  const hasOnlineUser = () => {
    for (let i = users.length; i >= 0; i -= 1)
      if (isOnlineUserWithOfflineProjects(users[i]?.id)) return true;
    return false;
  };

  const isOfflineUserWithProjects = (userId: string) => {
    const userRec = users.filter((u) => u.id === userId);
    return userRec.length > 0 && userRec[0]?.keys?.remoteId === undefined;
  };

  const hasOfflineUser = () => {
    for (let i = users.length; i >= 0; i -= 1)
      if (isOfflineUserWithProjects(users[i]?.id)) return true;
  };

  const handleLogout = () => {
    doLogout();
    setView('Logout');
  };

  useEffect(() => {
    if (isElectron) persistData();
    setLanguage(localeDefault(isDeveloper));
    fetchLocalization();
    Online((connected) => {
      setConnected(connected);
    }, auth);
    setOrganization('');
    setProject('');
    setPlan('');
    setProjRole('');
    setProjType('');
    setWhichUsers(
      localStorage.getItem('hasOfflineProjects') === 'true'
        ? 'offline'
        : 'online'
    );
    if (!auth?.isAuthenticated()) {
      if (!offline && !isElectron) {
        setConnected(true);
        handleLogin();
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    if (isElectron && selectedUser === '') {
      ipc?.invoke('get-profile').then((result: any) => {
        if (result) {
          // Even tho async, this executes first b/c users takes time to load
          ipc?.invoke('get-token').then((accessToken: any) => {
            const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
            setConnected(true);
            if (offline && loggedIn) setOffline(false);
            if (auth) auth.setDesktopSession(result, accessToken);
            if (selectedUser === '' && loggedIn) setSelectedUser('unknownUser');
          });
        }
      });
    }
    const userId = localStorage.getItem('online-user-id');
    if (isElectron && userId && !curUser) {
      const thisUser = users.filter(
        (u) => u.id === userId && Boolean(u?.keys?.remoteId)
      );
      setCurUser(thisUser[0]);
      setLanguage(thisUser[0]?.attributes?.locale || 'en');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  if (auth?.accessToken && !auth?.emailVerified()) {
    if (localStorage.getItem('isLoggedIn') === 'true')
      return <Redirect to="/emailunverified" />;
    else doLogout();
  } else if (
    (!isElectron && auth?.isAuthenticated()) ||
    offlineOnly ||
    (isElectron && selectedUser !== '')
  ) {
    return <Redirect to="/loading" />;
  }
  if (/Logout/i.test(view)) {
    return <Redirect to="/logout" />;
  }
  const handleOfflineChange = (event: any) => {
    setWhichUsers(event.target.value);
    localStorage.setItem(
      'hasOfflineProjects',
      event.target.value === 'offline' ? 'true' : 'false'
    );
  };

  return (
    <div className={classes.root}>
      <AppHead {...props} />
      {isElectron && (
        <div className={classes.container}>
          <Typography className={classes.sectionHead}>Filler 1</Typography>{' '}
          <Paper className={classes.paper}>
            <Box className={classes.box}>
              <RadioGroup
                aria-label="offline"
                name="offlineprojects"
                value={whichUsers}
                onChange={handleOfflineChange}
              >
                <div>
                  <Radio value="online" id="onlineradio" />
                  <FormLabel>
                    Project Admin is online.&nbsp; <OnlineIcon />
                    <br />
                    &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Transcription can be done
                    online or offline.&nbsp;
                    <OnlineIcon /> <OfflineIcon />
                  </FormLabel>
                </div>
                <div>
                  <Radio value="offline" id="offlineradio" />
                  <FormLabel>
                    Project Admin is offline.&nbsp; <OfflineIcon /> <br />
                    &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; All work will always be
                    done offline.&nbsp;
                    <OfflineIcon />
                  </FormLabel>
                </div>
              </RadioGroup>
            </Box>
            {whichUsers === 'online' && (
              <div>
                <Typography className={classes.sectionHead}>
                  {t.withInternet}
                </Typography>
                {curUser ? (
                  <>
                    <div className={classes.actions}>
                      <UserListItem
                        u={curUser}
                        users={users}
                        onSelect={handleGoOnline}
                      />
                    </div>
                    <div>To choose another user, Log out...</div>
                    <Button
                      id="accessLogin"
                      variant="contained"
                      color="primary"
                      className={classes.button}
                      onClick={handleLogout}
                    >
                      {t.logout}
                    </Button>
                  </>
                ) : (
                  <Button
                    id="accessLogin"
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={handleGoOnline}
                  >
                    {t.logIn}
                  </Button>
                )}
                <Typography className={classes.sectionHead}>
                  {t.withoutInternet}
                </Typography>
                {!hasOnlineUser() && (
                  <div>
                    To allow offline use, while online mark your project as
                    "Available Offline" in your project settings, or Import a
                    Project that your admin has exported.
                  </div>
                )}
                {importStatus?.complete !== false && hasOnlineUser() && (
                  <UserList
                    isSelected={isOnlineUserWithOfflineProjects}
                    select={handleSelect}
                    title={t.availableOnlineUsers}
                  />
                )}
              </div>
            )}
            {whichUsers === 'offline' && (
              <div>
                {importStatus?.complete !== false && hasOfflineUser() && (
                  <UserList
                    isSelected={isOfflineUserWithProjects}
                    select={handleSelect}
                    title={t.availableOfflineUsers}
                  />
                )}
                <div className={classes.actions}>
                  <Button
                    id="accessCreateUser"
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={handleCreateUser}
                  >
                    {t.createUser}
                  </Button>
                </div>
              </div>
            )}
            <div className={classes.actions}>
              <Button
                id="accessImport"
                variant="contained"
                color="primary"
                className={classes.button}
                onClick={handleImport}
              >
                {t.importSnapshot}
              </Button>
            </div>
          </Paper>
          {importOpen && (
            <ImportTab auth={auth} isOpen={importOpen} onOpen={setImportOpen} />
          )}
        </div>
      )}
      {isElectron && goOnlineConfirmation && (
        <Confirm
          title={t.logIn}
          yesResponse={handleGoOnlineConfirmed}
          noResponse={handleGoOnlineRefused}
          no={t.cancel}
        />
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
