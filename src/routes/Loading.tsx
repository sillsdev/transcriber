import { useState, useEffect, useContext, useRef } from 'react';
import Axios from 'axios';
import { useGlobal } from '../context/GlobalContext';
import { TokenContext } from '../context/TokenProvider';
import { shallowEqual } from 'react-redux';
import {
  IState,
  IToken,
  IMainStrings,
  Invitation,
  User,
  InvitationD,
  IApiError,
  UserD,
} from '../model';
import { Box, SxProps } from '@mui/material';
import * as action from '../store';
import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import IndexedDBSource from '@orbit/indexeddb';
import {
  uiLang,
  uiLangDev,
  localeDefault,
  localUserKey,
  LocalKey,
  currentDateTime,
  forceLogin,
  useMyNavigate,
} from '../utils';
import {
  related,
  GetUser,
  LoadData,
  remoteIdGuid,
  usePlan,
  useLoadProjectData,
  SetUserLanguage,
  useOfflineSetup,
  useRole,
  AcceptInvitation,
  useProjectType,
} from '../crud';
import { useSnackBar } from '../hoc/SnackBar';
import { API_CONFIG, isElectron } from '../api-variable';
import AppHead from '../components/App/AppHead';
import { useOfflnProjRead } from '../crud/useOfflnProjRead';
import ImportTab from '../components/ImportTab';
import jwtDecode from 'jwt-decode';
import { ApmSplash } from '../components/ApmSplash';
import { AltButton, PriButton } from '../control';
import { RecordKeyMap } from '@orbit/records';
import { useSelector } from 'react-redux';
import { mainSelector } from '../selector';
import { useDispatch } from 'react-redux';

const centerProps = { display: 'flex', justifyContent: 'center' } as SxProps;

export function Loading() {
  const orbitFetchResults = useSelector(
    (state: IState) => state.orbit.fetchResults
  );
  const t: IMainStrings = useSelector(mainSelector, shallowEqual);
  const dispatch = useDispatch();
  const fetchLocalization = () => dispatch(action.fetchLocalization());
  const setLanguage = (lang: string) => dispatch(action.setLanguage(lang));
  const fetchOrbitData = (props: action.IFetchOrbitData) =>
    dispatch(action.fetchOrbitData(props));
  const setExpireAt = (expireAt: number) =>
    dispatch(action.setExpireAt(expireAt));
  const doOrbitError = (error: IApiError) =>
    dispatch(action.doOrbitError(error));
  const orbitComplete = () => dispatch(action.orbitComplete());
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator?.getSource('memory') as Memory;
  const backup = coordinator?.getSource('backup') as IndexedDBSource;
  const remote = coordinator?.getSource('remote') as JSONAPISource;
  const [offline] = useGlobal('offline');
  const [fingerprint] = useGlobal('fingerprint');
  const [user, setUser] = useGlobal('user');
  const [globalStore] = useGlobal();
  const [, setLang] = useGlobal('lang');
  const [, setOrbitRetries] = useGlobal('orbitRetries');
  const [, setProjectsLoaded] = useGlobal('projectsLoaded');
  const [loadComplete, setLoadComplete] = useGlobal('loadComplete');
  const [isDeveloper] = useGlobal('developer');
  const [, setOrganization] = useGlobal('organization');
  const { setMyOrgRole } = useRole();
  const [, setProject] = useGlobal('project');
  const tokenCtx = useContext(TokenContext);
  const { accessToken, profile, authenticated } = tokenCtx.state;
  const [uiLanguages] = useState(isDeveloper ? uiLangDev : uiLang);
  const [, setCompleted] = useGlobal('progress');
  const { showMessage } = useSnackBar();
  const navigate = useMyNavigate();
  const getOfflineProject = useOfflnProjRead();
  const { getPlan } = usePlan();
  const [importOpen, setImportOpen] = useState(false);
  const [doSync, setDoSync] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const [, setBusy] = useGlobal('importexportBusy');
  const offlineSetup = useOfflineSetup();
  const LoadProjData = useLoadProjectData();
  const { setProjectType } = useProjectType();
  const [, setPlan] = useGlobal('plan');
  const [view, setView] = useState('');
  const [inviteError, setInviteError] = useState('');
  const mounted = useRef(0);

  //remote is passed in because it wasn't always available in global
  const InviteUser = async (newremote: JSONAPISource, userEmail: string) => {
    const inviteId = localStorage.getItem('inviteId');
    var inviteErr = '';

    //filter will be passed to api which will lowercase the email before comparison
    var allinvites: InvitationD[] = (await newremote.query((q) =>
      q.findRecords('invitation').filter(
        { attribute: 'email', value: userEmail.toLowerCase() }
        // { attribute: 'accepted', value: false }  //went from AND to OR between attributes :/
      )
    )) as any;
    allinvites
      .filter((i) => !i.attributes.accepted)
      .forEach(async (invitation) => {
        await AcceptInvitation(newremote, invitation);
      });

    if (inviteId) {
      let invite = allinvites.find((i) => i.id === inviteId);
      if (!invite) {
        try {
          //ARGH...this ignores the id and just gets them all...
          const thisinvite: Invitation[] = (
            (await newremote.query((q) =>
              q.findRecord({ type: 'invitation', id: inviteId })
            )) as Invitation[]
          ).filter((i) => i.keys?.remoteId === inviteId);
          if (
            thisinvite[0].attributes.email.toLowerCase() !==
            userEmail.toLowerCase()
          ) {
            /* they must have logged in with another email */
            inviteErr = t.inviteError;
          }
        } catch {
          //it's either deleted, or I don't have access to it
          //check if my paratext email is linked
          if (!(await checkAlternateParatextEmail(inviteId))) {
            inviteErr = t.deletedInvitation;
          }
        }
      }
      if (inviteErr !== '') {
        setInviteError(inviteErr);
        localStorage.setItem('inviteError', inviteErr);
        showMessage(inviteErr);
      } else {
        localStorage.removeItem('inviteId');
      }
    }
  };

  const checkAlternateParatextEmail = async (inviteId: string) => {
    try {
      let response = await Axios.get(
        API_CONFIG.host + '/api/paratext/useremail/' + inviteId,
        {
          headers: {
            Authorization: 'Bearer ' + accessToken,
          },
        }
      );
      if (response.data === inviteId) return true;
    } catch (err: any) {
      return false;
    }
  };
  useEffect(() => {
    if (mounted.current > 0) return;
    mounted.current += 1;
    if (!offline && !authenticated()) return;
    if (!offline) {
      const decodedToken = jwtDecode(accessToken || '') as IToken;
      setExpireAt(decodedToken.exp);
    }
    setLanguage(localeDefault(isDeveloper === 'true'));
    localStorage.removeItem('inviteError');
    fetchLocalization();
    fetchOrbitData({
      coordinator,
      tokenCtx,
      fingerprint,
      setUser,
      setProjectsLoaded,
      setOrbitRetries,
      setLang,
      global: globalStore,
      getOfflineProject,
      offlineSetup,
      showMessage,
    });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    if (orbitFetchResults) {
      //fetchOrbitData is complete

      //set user language
      SetUserLanguage(memory, user, setLanguage);

      if (orbitFetchResults?.syncBuffer) {
        setImportOpen(true);
        setDoSync(true);
      } else {
        setSyncComplete(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orbitFetchResults, memory, user]);

  useEffect(() => {
    if (!importOpen && doSync) {
      //import dialog has been closed
      setDoSync(false);
      setSyncComplete(true);
      setBusy(false);
    }
  }, [doSync, importOpen, setBusy]);

  const getGotoUrl = () => {
    let fromUrl =
      localStorage.getItem(LocalKey.deeplink) ??
      localStorage.getItem(localUserKey(LocalKey.url));

    if (fromUrl) {
      localStorage.removeItem(LocalKey.deeplink);
      return fromUrl;
    }
    return null;
  };
  const loadDone = (
    projectId: string,
    planId: string,
    fromUrl: string | null
  ) => {
    const projRec = memory.cache.query((q) =>
      q.findRecord({ type: 'project', id: projectId })
    );
    if (projRec) {
      setProject(projectId);
      const orgId = related(projRec, 'organization') as string;
      setOrganization(orgId);
      setMyOrgRole(orgId);
      setProjectType(projectId);
      setPlan(planId);
    }
  };
  const LoadComplete = () => {
    setCompleted(100);
    setLoadComplete(true);
    orbitComplete();
    //state inviteError not set yet...so use this
    if (localStorage.getItem('inviteError')) {
      return;
    }
    const user = localStorage.getItem(LocalKey.userId) as string;
    const userRec: User = GetUser(memory, user);
    if (
      !userRec?.attributes?.givenName ||
      !userRec?.attributes?.timezone ||
      !userRec?.attributes?.locale ||
      !uiLanguages.includes(userRec?.attributes?.locale)
    ) {
      setView('/profile');
      return;
    }
    let fromUrl = getGotoUrl();
    let waitToNavigate = false;
    if (fromUrl && !/^\/profile|^\/plan|^\/detail/.test(fromUrl))
      fromUrl = null;
    if (fromUrl) {
      const m = /^\/[workplandetail]+\/([0-9a-f-]+)/.exec(fromUrl);
      if (m) {
        const planId =
          remoteIdGuid('plan', m[1], memory?.keyMap as RecordKeyMap) || m[1];
        const planRec = getPlan(planId);
        if (offline) {
          const oProjRec = planRec && getOfflineProject(planRec);
          if (!oProjRec?.attributes?.offlineAvailable) fromUrl = null;
          if (fromUrl) {
            const projectId = related(planRec, 'project') as string | null;
            if (projectId) {
              loadDone(projectId, planId, fromUrl);
            }
          }
        } else {
          const projectId = related(planRec, 'project') as string | null;
          if (projectId) {
            waitToNavigate = true;
            LoadProjData(projectId, () => {
              loadDone(projectId, planId, fromUrl);
              navigate(fromUrl || '/team');
            });
          }
        }
      } else if (!/^\/profile/.test(fromUrl)) fromUrl = null;
    }
    if (!waitToNavigate) navigate(fromUrl || '/team');
  };

  useEffect(() => {
    const finishRemoteLoad = () => {
      const tokData = profile || { sub: '' };
      localStorage.removeItem('goingOnline');
      remote
        .query((q) =>
          q
            .findRecords('user')
            .filter({ attribute: 'auth0Id', value: tokData.sub })
        )
        .then((result) => {
          let users: UserD[] = result as any;
          if (!Array.isArray(users)) users = [users];
          const user = users[0];
          InviteUser(
            remote,
            user?.attributes?.email?.toLowerCase() || 'neverhere'
          ).then(() => {
            setCompleted(10);
            LoadData(coordinator, setCompleted, doOrbitError).then(() => {
              LoadComplete();
            });
          });
        });
    };
    const processBackup = async () => {
      //sync was either not needed, or is done
      if (syncComplete && orbitFetchResults) {
        if (orbitFetchResults.goRemote) {
          localStorage.setItem(localUserKey(LocalKey.time), currentDateTime());
          if (isElectron) finishRemoteLoad();
          else {
            await backup.reset();
            await backup.cache.openDB();
            setProjectsLoaded([]);
            finishRemoteLoad();
          }
        } else {
          LoadComplete();
        }
      }
    };
    processBackup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncComplete, orbitFetchResults]);
  const continueWithCurrentUser = () => {
    localStorage.removeItem('inviteError');
    localStorage.removeItem('inviteId');
    LoadComplete();
  };

  const logoutAndTryAgain = () => {
    forceLogin();
    setView('/logout');
  };

  if (!offline && !authenticated()) navigate('/');
  if (view !== '') navigate(view);

  return (
    <Box sx={{ width: '100%' }}>
      <AppHead />
      <Box sx={centerProps}>
        <ApmSplash
          message={inviteError}
          component={
            <>
              {loadComplete && inviteError && (
                <Box sx={centerProps}>
                  <PriButton id="errCont" onClick={continueWithCurrentUser}>
                    {t.continueCurrentUser}
                  </PriButton>
                  <AltButton id="errLogout" onClick={logoutAndTryAgain}>
                    {t.logout}
                  </AltButton>
                </Box>
              )}
              {isElectron && importOpen && (
                <ImportTab
                  syncBuffer={orbitFetchResults?.syncBuffer}
                  syncFile={orbitFetchResults?.syncFile}
                  isOpen={importOpen}
                  onOpen={setImportOpen}
                />
              )}
            </>
          }
        />
      </Box>
    </Box>
  );
}

export default Loading;
