import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
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
  // Paper,
  Box,
  // IconButton
} from '@material-ui/core';
import Auth from '../auth/Auth';
import { Online, forceLogin, waitForIt } from '../utils';
import { related, useOfflnProjRead, useOfflineSetup } from '../crud';
import { IAxiosStatus } from '../store/AxiosStatus';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../mods/react-orbitjs';
import { API_CONFIG, isElectron } from '../api-variable';
import ImportTab from '../components/ImportTab';
import Confirm from '../components/AlertDialog';
import UserList from '../control/UserList';
import { useSnackBar } from '../hoc/SnackBar';
import AppHead from '../components/App/AppHead';
import { UserListItem } from '../control';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
// import HelpIcon from '@material-ui/icons/Help';
import UserListMode, { ListMode } from '../control/userListMode';
const noop = {} as any;
const ipc = isElectron ? require('electron').ipcRenderer : null;
const electronremote = isElectron ? require('@electron/remote') : noop;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    page: {
      display: 'block',
    },
    listHead: {
      display: 'flex',
      justifyContent: 'space-between',
      paddingTop: theme.spacing(4),
      paddingBottom: 0,
    },
    hidden: {
      visibility: 'hidden',
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    },
    paper: {
      padding: theme.spacing(3),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    title: {
      fontSize: '16pt',
    },
    sectionHead: {
      fontSize: '14pt',
      paddingTop: theme.spacing(2),
    },
    actions: {
      paddingTop: theme.spacing(2),
    },
    button: {
      margin: theme.spacing(1),
      minWidth: theme.spacing(20),
    },
    box: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
    },
    helpIcon: {
      paddingLeft: '1px',
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
  const lastTime = localStorage.getItem('electron-lastTime');
  localStorage.removeItem('auth-id');
  localStorage.setItem('isLoggedIn', 'true');
  ipc?.invoke('login', lastTime !== null);
  electronremote?.getCurrentWindow().close();
};
export const doLogout = async () => {
  localStorage.removeItem('online-user-id');
  forceLogin();
  await ipc?.invoke('logout');
};
export const switchUser = async () => {
  await doLogout();
  setTimeout(() => {
    goOnline();
  }, 1500);
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
  const { pathname } = useLocation();
  const classes = useStyles();
  const { setLanguage } = props;
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const [offline, setOffline] = useGlobal('offline');
  const [user] = useGlobal('user');
  const [, setConnected] = useGlobal('connected');
  const [, setEditId] = useGlobal('editUserId');
  const [offlineOnly, setOfflineOnly] = useGlobal('offlineOnly');
  const [importOpen, setImportOpen] = useState(false);
  const [view, setView] = useState('');
  const [curUser, setCurUser] = useState<User>();
  const [whichUsers, setWhichUsers] = useState(
    pathname.substring('/access/'.length)
  );
  const [selectedUser, setSelectedUser] = useState('');
  const [, setOrganization] = useGlobal('organization');
  const [, setProject] = useGlobal('project');
  const [, setProjRole] = useGlobal('projRole');
  const [, setProjType] = useGlobal('projType');
  const [, setPlan] = useGlobal('plan');
  const offlineProjRead = useOfflnProjRead();
  const offlineSetup = useOfflineSetup();
  const { showMessage } = useSnackBar();
  const [listMode, setListMode] = useState<ListMode>(
    whichUsers === 'online-local' ? ListMode.WorkOffline : ListMode.SwitchUser
  );
  const [goOnlineConfirmation, setGoOnlineConfirmation] =
    useState<React.MouseEvent<HTMLElement>>();

  const handleModeChange = (mode: ListMode) => {
    setListMode(mode);
  };

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

  const handleSwitchUser = () => {
    Online(
      (online) => {
        if (online) {
          //setGoOnlineConfirmation(event);
          switchUser();
        } else {
          showMessage(t.mustBeOnline);
        }
      },
      auth,
      true
    );
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

  const countWorkOfflineUsers = () => {
    var count = 0;
    for (let i = users.length; i >= 0; i -= 1)
      if (isOnlineUserWithOfflineProjects(users[i]?.id)) count += 1;
    return count;
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
    localStorage.removeItem('user-id');
    doLogout();
    setView('Logout');
  };

  const handleBack = () => {
    //localStorage.removeItem('offlineAdmin');
    localStorage.setItem('offlineAdmin', 'choose');
    setWhichUsers('');
  };

  useEffect(() => {
    if (isElectron) persistData();
    setOrganization('');
    setProject('');
    setPlan('');
    setProjRole('');
    setProjType('');
    if (!auth?.isAuthenticated() && !isAuthenticated) {
      if (!offline && !isElectron) {
        setConnected(true);
        const hasUsed = localStorage.key(1) !== null;
        if (hasUsed) {
          loginWithRedirect();
        } else {
          const opts =
            API_CONFIG.snagId !== ''
              ? { mode: 'signUp' }
              : { login_hint: 'signUp' };
          loginWithRedirect(opts);
        }
      }
    }
    if (user) {
      if (localStorage.getItem('isLoggedIn') !== 'true') {
        handleSelect(user); //set by Quick Transcribe
      } else {
        waitForIt(
          'check if token is set',
          () => auth !== undefined,
          () => false,
          200
        ).then(() => {
          if (!localStorage.getItem('goingOnline')) {
            localStorage.setItem('goingOnline', 'true');
            handleGoOnline();
          }
        });
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
            if (loggedIn) {
              if (offline) setOffline(false);
              if (auth) auth.setDesktopSession(result, accessToken);
            }
            if (selectedUser === '' && loggedIn) setSelectedUser('unknownUser');
          });
        }
      });
    }
    const userId = localStorage.getItem('online-user-id');
    console.log(`access whichUsers=${whichUsers}`);
    if (isElectron && userId && !curUser) {
      const thisUser = users.filter(
        (u) => u.id === userId && Boolean(u?.keys?.remoteId)
      );
      setCurUser(thisUser[0]);
      setLanguage(thisUser[0]?.attributes?.locale || 'en');
    } else if (isElectron && !userId && whichUsers.startsWith('online-cloud')) {
      localStorage.setItem('online-user-id', 'unknown');
      handleGoOnline();
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
  if (whichUsers === '') return <Redirect to="/" />;

  const CurrentUser = ({
    curUser,
    action,
  }: {
    curUser: User;
    action?: () => void;
  }) => (
    <>
      <Typography className={classes.sectionHead}>{t.currentUser}</Typography>
      <div className={classes.actions}>
        <UserListItem
          u={curUser}
          users={users}
          onSelect={action ? action : handleGoOnline}
        />
      </div>
    </>
  );

  const handleCurUser = () => {
    handleSelect(curUser?.id || '');
  };

  return (
    <div className={classes.root}>
      <AppHead {...props} />
      {isElectron && (
        <div className={classes.page}>
          <Typography className={classes.sectionHead}>
            Hello I'm under the AppHead
          </Typography>
          <div className={classes.listHead}>
            <Button id="back" color="primary" onClick={handleBack}>
              <ArrowBackIcon />
              {t.back}
            </Button>
            <Typography className={classes.title}>{t.title}</Typography>
            <Button className={classes.hidden}>
              <ArrowBackIcon />
              {t.back}
            </Button>
          </div>

          {whichUsers.startsWith('online') && (
            <div className={classes.container}>
              <>
                <UserListMode
                  mode={listMode}
                  onMode={handleModeChange}
                  loggedIn={Boolean(curUser)}
                  allowOffline={hasOnlineUser()}
                />
                {listMode === ListMode.SwitchUser ? (
                  <div className={classes.container}>
                    {curUser && (
                      <>
                        <CurrentUser curUser={curUser} />
                        <Typography className={classes.sectionHead}>
                          {t.availableUsers}
                        </Typography>
                      </>
                    )}
                    {!hasOnlineUser() && whichUsers === 'online-team' && (
                      <div>
                        <Box>{t.noOnlineUsers1}</Box>
                        <Box>{t.noOnlineUsers2}</Box>
                      </div>
                    )}
                    {!hasOnlineUser() && whichUsers === 'online-alone' && (
                      <div>
                        <Box>{t.noOnlineUsers3}</Box>
                        <Box>{t.noOnlineUsers4}</Box>
                      </div>
                    )}
                    <div className={classes.actions}>
                      <Button
                        id="accessLogin"
                        variant="contained"
                        color="primary"
                        className={classes.button}
                        onClick={handleSwitchUser}
                      >
                        {t.logIn}
                      </Button>
                    </div>
                    {/* </Paper> */}
                  </div>
                ) : listMode === ListMode.WorkOffline ? (
                  <>
                    {curUser && (
                      <>
                        <CurrentUser curUser={curUser} action={handleCurUser} />
                        {countWorkOfflineUsers() > 1 && (
                          <Typography className={classes.sectionHead}>
                            {t.availableUsers}
                          </Typography>
                        )}
                      </>
                    )}
                    <UserList
                      isSelected={isOnlineUserWithOfflineProjects}
                      select={handleSelect}
                      curId={curUser?.id}
                    />
                  </>
                ) : (
                  curUser && (
                    <>
                      <CurrentUser curUser={curUser} action={handleLogout} />
                      <Button
                        id="accessLogin"
                        variant="outlined"
                        color="primary"
                        className={classes.button}
                        onClick={handleLogout}
                      >
                        {t.logout}
                      </Button>
                    </>
                  )
                )}
              </>
            </div>
          )}
          {whichUsers === 'offline' && (
            <div className={classes.container}>
              <Typography className={classes.sectionHead}>
                {t.offlineUsers}
              </Typography>
              {importStatus?.complete !== false && hasOfflineUser() && (
                <UserList
                  isSelected={isOfflineUserWithProjects}
                  select={handleSelect}
                  title={t.offlineUsers}
                />
              )}
              <div className={classes.actions}>
                <Button
                  id="accessCreateUser"
                  variant="outlined"
                  color="primary"
                  className={classes.button}
                  onClick={handleCreateUser}
                >
                  {t.createUser}
                </Button>
              </div>
              <div className={classes.actions}>
                <Button
                  id="accessImport"
                  variant="outlined"
                  color="primary"
                  className={classes.button}
                  onClick={handleImport}
                >
                  {t.importSnapshot}
                </Button>
              </div>
            </div>
          )}
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
