import { useState, useEffect, useContext } from 'react';
import Axios from 'axios';
import { useGlobal } from 'reactn';
import { TokenContext } from '../context/TokenProvider';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  IState,
  IToken,
  IMainStrings,
  Invitation,
  User,
  ISharedStrings,
  IFetchResults,
} from '../model';
import { QueryBuilder } from '@orbit/data';
import localStrings from '../selector/localize';
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

const centerProps = { display: 'flex', justifyContent: 'center' } as SxProps;

interface IStateProps {
  t: IMainStrings;
  ts: ISharedStrings;
  orbitFetchResults: IFetchResults | undefined;
}

interface IDispatchProps {
  fetchLocalization: typeof action.fetchLocalization;
  setLanguage: typeof action.setLanguage;
  fetchOrbitData: typeof action.fetchOrbitData;
  setExpireAt: typeof action.setExpireAt;
  doOrbitError: typeof action.doOrbitError;
  orbitComplete: typeof action.orbitComplete;
}

interface IProps {}

export function Loading(props: IProps & IStateProps & IDispatchProps) {
  const { orbitFetchResults, t } = props;
  const {
    fetchOrbitData,
    orbitComplete,
    doOrbitError,
    fetchLocalization,
    setLanguage,
    setExpireAt,
  } = props;
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  const remote = coordinator.getSource('remote') as JSONAPISource;
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

  //remote is passed in because it wasn't always available in global
  const InviteUser = async (newremote: JSONAPISource, userEmail: string) => {
    const inviteId = localStorage.getItem('inviteId');
    var inviteErr = '';

    //filter will be passed to api which will lowercase the email before comparison
    var allinvites: Invitation[] = (await newremote.query((q: QueryBuilder) =>
      q.findRecords('invitation').filter(
        { attribute: 'email', value: userEmail }
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
            (await newremote.query((q: QueryBuilder) =>
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
    // console.clear();
    if (!offline && !authenticated()) return;
    if (!offline) {
      const decodedToken = jwtDecode(accessToken || '') as IToken;
      setExpireAt(decodedToken.exp);
    }
    setLanguage(localeDefault(isDeveloper));
    localStorage.removeItem('inviteError');
    fetchLocalization();
    fetchOrbitData(
      coordinator,
      tokenCtx,
      fingerprint,
      setUser,
      setProjectsLoaded,
      setOrbitRetries,
      setLang,
      globalStore,
      getOfflineProject,
      offlineSetup,
      showMessage
    );
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
  }, [orbitFetchResults, memory, setLanguage, user]);

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
      localStorage.getItem(localUserKey(LocalKey.deeplink)) ??
      localStorage.getItem(localUserKey(LocalKey.url));
    if (fromUrl) {
      localStorage.removeItem(localUserKey(LocalKey.deeplink));
      return fromUrl;
    }
    return localStorage.getItem(localUserKey(LocalKey.deeplink));
  };
  const LoadComplete = () => {
    setCompleted(100);
    setLoadComplete(true);
    orbitComplete();
    //state inviteError not set yet...so use this
    if (localStorage.getItem('inviteError')) {
      return;
    }
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
        const planId = remoteIdGuid('plan', m[1], memory.keyMap) || m[1];
        const planRec = getPlan(planId);
        if (offline) {
          const oProjRec = planRec && getOfflineProject(planRec);
          if (!oProjRec?.attributes?.offlineAvailable) fromUrl = null;
        } else {
          const projectId = related(planRec, 'project') as string | null;
          if (projectId) {
            waitToNavigate = true;
            LoadProjData(projectId, () => {
              const projRec = memory.cache.query((q: QueryBuilder) =>
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
        .pull((q) =>
          q
            .findRecords('user')
            .filter({ attribute: 'auth0Id', value: tokData.sub })
        )
        .then((tr) => {
          const user = (tr[0].operations[0] as any).record as User;
          InviteUser(remote, user?.attributes?.email || 'neverhere').then(
            () => {
              setCompleted(10);
              LoadData(coordinator, setCompleted, doOrbitError).then(() => {
                LoadComplete();
              });
            }
          );
        });
    };
    //sync was either not needed, or is done
    if (syncComplete && orbitFetchResults) {
      if (orbitFetchResults.goRemote) {
        localStorage.setItem(localUserKey(LocalKey.time), currentDateTime());
        if (isElectron) finishRemoteLoad();
        else
          backup.reset().then(() => {
            setProjectsLoaded([]);
            finishRemoteLoad();
          });
      } else {
        LoadComplete();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncComplete, orbitFetchResults]);
  const continueWithCurrentUser = () => {
    localStorage.removeItem('inviteError');
    localStorage.removeItem('inviteId');
    LoadComplete();
  };

  const logoutAndTryAgain = () => {
    forceLogin();
    setView('Logout');
  };

  if (!offline && !authenticated()) navigate('/');
  if (view !== '') navigate(view);

  return (
    <Box sx={{ width: '100%' }}>
      <AppHead {...props} />
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

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
  ts: localStrings(state, { layout: 'shared' }),
  orbitFetchResults: state.orbit.fetchResults,
});

const mapDispatchToProps = (dispatch: any) => ({
  ...bindActionCreators(
    {
      fetchLocalization: action.fetchLocalization,
      setLanguage: action.setLanguage,
      fetchOrbitData: action.fetchOrbitData,
      setExpireAt: action.setExpireAt,
      doOrbitError: action.doOrbitError,
      orbitComplete: action.orbitComplete,
    },
    dispatch
  ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Loading as any) as any as (props: IProps) => JSX.Element;
