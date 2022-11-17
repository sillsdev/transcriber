import React, { useState, useEffect, useContext } from 'react';
import { useGlobal } from 'reactn';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { connect, shallowEqual, useSelector } from 'react-redux';
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
import { TokenContext } from '../context/TokenProvider';
import localStrings from '../selector/localize';
import * as action from '../store';
import {
  Typography,
  Button,
  Box,
  styled,
  TypographyProps,
  BoxProps,
} from '@mui/material';
import { useCheckOnline, forceLogin, waitForIt } from '../utils';
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
import { AltButton, PriButton, UserListItem } from '../control';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UserListMode, { ListMode } from '../control/userListMode';
import { accessSelector } from '../selector';
const noop = {} as any;
const ipc = isElectron ? require('electron').ipcRenderer : null;
const electronremote = isElectron ? require('@electron/remote') : noop;

const SectionHead = styled(Typography)<TypographyProps>(({ theme }) => ({
  fontSize: '14pt',
  paddingTop: theme.spacing(2),
}));

const ContainerBox = styled(Box)<BoxProps>(() => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
}));

const ActionBox = styled(Box)<BoxProps>(({ theme }) => ({
  paddingTop: theme.spacing(2),
}));

interface ICurrentUser {
  curUser: User;
  users: User[];
  action?: () => void;
  goOnline: () => void;
  showTeams: boolean;
}

const CurrentUser = ({
  curUser,
  users,
  action,
  goOnline,
  showTeams,
}: ICurrentUser) => {
  const t: IAccessStrings = useSelector(accessSelector, shallowEqual);

  return (
    <>
      <SectionHead>{t.currentUser}</SectionHead>
      <Box sx={{ pt: 2 }}>
        <UserListItem
          u={curUser}
          users={users}
          onSelect={action ? action : goOnline}
          showTeams={showTeams}
        />
      </Box>
    </>
  );
};

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

interface IProps {}
export const goOnline = (email?: string) => {
  const lastTime = localStorage.getItem('electron-lastTime');
  localStorage.removeItem('auth-id');
  localStorage.setItem('isLoggedIn', 'true');
  const hasUsed = lastTime !== null;
  ipc?.invoke('login', hasUsed, email);
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
  }, 2000);
};
export function Access(
  props: IProps & IRecordProps & IStateProps & IDispatchProps
) {
  const {
    t,
    importStatus,
    users,
    groupMemberships,
    projects,
    plans,
    sections,
  } = props;
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { setLanguage } = props;
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const [offline, setOffline] = useGlobal('offline');
  const [user] = useGlobal('user');

  const [, setEditId] = useGlobal('editUserId');
  const [offlineOnly, setOfflineOnly] = useGlobal('offlineOnly');
  const tokenCtx = useContext(TokenContext);
  const { logout, accessToken, expiresAt } = tokenCtx.state;
  const [importOpen, setImportOpen] = useState(false);
  const [view, setView] = useState('');
  const [curUser, setCurUser] = useState<User>();
  const [whichUsers, setWhichUsers] = useState(
    pathname.substring('/access/'.length)
  );
  const [selectedUser, setSelectedUser] = useState('');
  const [, setOrganization] = useGlobal('organization');
  const [, setOrgRole] = useGlobal('orgRole');
  const [, setProject] = useGlobal('project');
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
  const checkOnline = useCheckOnline();
  const handleModeChange = (mode: ListMode) => {
    setListMode(mode);
  };

  const handleSelect = (uId: string) => {
    const selected = users.filter((u) => u.id === uId);
    if (selected.length > 0) {
      if (selected[0]?.keys?.remoteId === undefined) setOfflineOnly(true);
      setOffline(true);
      logout();
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
        const email = curUser?.attributes?.auth0Id.startsWith('auth0|')
          ? curUser?.attributes?.email
          : undefined;
        goOnline(email);
      } else ipc?.invoke('logout');
    }
    setGoOnlineConfirmation(undefined);
  };
  const handleGoOnlineRefused = () => {
    setGoOnlineConfirmation(undefined);
  };

  const handleGoOnline = () => {
    checkOnline((online) => {
      if (online) {
        //setGoOnlineConfirmation(event);
        handleGoOnlineConfirmed();
      } else {
        showMessage(t.mustBeOnline);
      }
    }, true);
  };

  const handleSwitchUser = () => {
    checkOnline((online) => {
      if (online) {
        //setGoOnlineConfirmation(event);
        switchUser();
      } else {
        showMessage(t.mustBeOnline);
      }
    }, true);
  };

  const handleCreateUser = async () => {
    setOffline(true);
    logout();
    setOfflineOnly(true);
    await offlineSetup();
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
    localStorage.removeItem('isLoggedIn');
    setWhichUsers('');
  };

  useEffect(() => {
    if (isElectron) persistData();
    setOrganization('');
    setOrgRole(undefined);
    setProject('');
    setPlan('');
    setProjType('');
    checkOnline((online) => {}, true);
    if (!tokenCtx.state.isAuthenticated() && !isAuthenticated) {
      if (!offline && !isElectron) {
        const hasUsed = localStorage.key(0) !== null;
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
    if (user && expiresAt !== -1) {
      if (localStorage.getItem('isLoggedIn') !== 'true') {
        handleSelect(user); //set by Quick Transcribe
      } else {
        waitForIt(
          'check if token is set',
          () => accessToken !== undefined,
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
  }, [accessToken]);

  useEffect(() => {
    if (isElectron && selectedUser === '') {
      ipc?.invoke('get-profile').then((result: any) => {
        if (result) {
          // Even tho async, this executes first b/c users takes time to load
          ipc?.invoke('get-token').then((accessToken: any) => {
            const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
            if (loggedIn) {
              if (offline) setOffline(false);
              tokenCtx.state.setAuthSession(result, accessToken);
            }
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
    } else if (isElectron && !userId && whichUsers.startsWith('online-cloud')) {
      localStorage.setItem('online-user-id', 'unknown');
      handleGoOnline();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  if (tokenCtx.state.accessToken && !tokenCtx.state.email_verified) {
    if (localStorage.getItem('isLoggedIn') === 'true')
      navigate('/emailunverified');
    else doLogout();
  } else if (
    (!isElectron && tokenCtx.state.isAuthenticated()) ||
    offlineOnly ||
    (isElectron && selectedUser !== '')
  ) {
    navigate('/loading');
  }
  if (/Logout/i.test(view)) {
    navigate('/logout');
  }
  if (whichUsers === '') navigate('/');

  const handleCurUser = () => {
    handleSelect(curUser?.id || '');
  };

  return (
    <Box sx={{ width: '100%' }}>
      <AppHead {...props} />
      {isElectron && (
        <Box sx={{ display: 'block' }}>
          <SectionHead>Hello I'm under the AppHead</SectionHead>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              pt: 4,
              pb: 0,
            }}
          >
            <Button id="back" color="primary" onClick={handleBack}>
              <ArrowBackIcon />
              {t.back}
            </Button>
            <Typography sx={{ fontSize: '16pt' }}>{t.title}</Typography>
            <Button sx={{ visibility: 'hidden' }}>
              <ArrowBackIcon />
              {t.back}
            </Button>
          </Box>

          {whichUsers.startsWith('online') && (
            <ContainerBox>
              <>
                <UserListMode
                  mode={listMode}
                  onMode={handleModeChange}
                  loggedIn={Boolean(curUser)}
                  allowOffline={hasOnlineUser()}
                />
                {listMode === ListMode.SwitchUser ? (
                  <ContainerBox>
                    {curUser && (
                      <>
                        <CurrentUser
                          curUser={curUser}
                          users={users}
                          showTeams={false}
                          goOnline={handleGoOnline}
                        />
                        <SectionHead>{t.availableUsers}</SectionHead>
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
                    <ActionBox>
                      <PriButton
                        id="accessSwitchUser"
                        onClick={handleSwitchUser}
                      >
                        {t.logIn}
                      </PriButton>
                    </ActionBox>
                    {/* </Paper> */}
                  </ContainerBox>
                ) : listMode === ListMode.WorkOffline ? (
                  <>
                    {curUser && (
                      <>
                        <CurrentUser
                          curUser={curUser}
                          users={users}
                          action={handleCurUser}
                          goOnline={handleGoOnline}
                          showTeams={true}
                        />
                        {countWorkOfflineUsers() > 1 && (
                          <SectionHead>{t.availableUsers}</SectionHead>
                        )}
                      </>
                    )}
                    <UserList
                      isSelected={isOnlineUserWithOfflineProjects}
                      select={handleSelect}
                      curId={curUser?.id}
                      showTeams={true}
                    />
                  </>
                ) : (
                  curUser && (
                    <>
                      <CurrentUser
                        curUser={curUser}
                        users={users}
                        action={handleLogout}
                        goOnline={handleGoOnline}
                        showTeams={false}
                      />
                      <AltButton id="logout" onClick={handleLogout}>
                        {t.logout}
                      </AltButton>
                    </>
                  )
                )}
              </>
            </ContainerBox>
          )}
          {whichUsers === 'offline' && (
            <ContainerBox>
              <SectionHead>{t.offlineUsers}</SectionHead>
              {importStatus?.complete !== false && hasOfflineUser() && (
                <UserList
                  isSelected={isOfflineUserWithProjects}
                  select={handleSelect}
                  title={t.offlineUsers}
                />
              )}
              <ActionBox>
                <AltButton id="accessCreateUser" onClick={handleCreateUser}>
                  {t.createUser}
                </AltButton>
              </ActionBox>
              <ActionBox>
                <AltButton id="accessImport" onClick={handleImport}>
                  {t.importSnapshot}
                </AltButton>
              </ActionBox>
            </ContainerBox>
          )}
          {importOpen && (
            <ImportTab isOpen={importOpen} onOpen={setImportOpen} />
          )}
        </Box>
      )}
      {isElectron && goOnlineConfirmation && (
        <Confirm
          title={t.logIn}
          yesResponse={handleGoOnlineConfirmed}
          noResponse={handleGoOnlineRefused}
          no={t.cancel}
        />
      )}
    </Box>
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
) as any as (props: IProps) => JSX.Element;
