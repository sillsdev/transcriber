import React, { useState, useEffect, useContext } from 'react';
import Axios from 'axios';
import { useGlobal } from 'reactn';
import { TokenContext } from '../context/TokenProvider';
import { Redirect, useHistory } from 'react-router-dom';
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
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { Typography, Paper, Button } from '@material-ui/core';
import * as action from '../store';
import logo from './LogoNoShadow-4x.png';
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
  useProjectType,
  AcceptInvitation,
} from '../crud';
import { useSnackBar } from '../hoc/SnackBar';
import { API_CONFIG, isElectron } from '../api-variable';
import AppHead from '../components/App/AppHead';
import { useOfflnProjRead } from '../crud/useOfflnProjRead';
import ImportTab from '../components/ImportTab';
import jwtDecode from 'jwt-decode';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    container: {
      display: 'flex',
      justifyContent: 'center',
    },
    grow: {
      flexGrow: 1,
    },
    appBar: {
      width: '100%',
      boxShadow: 'none',
    },
    paper: {
      paddingTop: 16,
      paddingBottom: 16,
      marginTop: theme.spacing(10),
      width: '30%',
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center',
      [theme.breakpoints.down('md')]: {
        width: '100%',
      },
    },
    button: { margin: theme.spacing(1) },
    icon: {
      alignSelf: 'center',
      width: '256px',
      height: '256px',
    },
    message: {
      alignSelf: 'center',
      textAlign: 'center',
    },
  })
);

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
  resetOrbitError: typeof action.resetOrbitError;
}

interface IProps extends IStateProps, IDispatchProps {}

export function Loading(props: IProps) {
  const { orbitFetchResults, t } = props;
  const classes = useStyles();
  const {
    fetchOrbitData,
    orbitComplete,
    doOrbitError,
    resetOrbitError,
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
  const [, setPlan] = useGlobal('plan');
  const [, setOrganization] = useGlobal('organization');
  const [, setProject] = useGlobal('project');
  const tokenCtx = useContext(TokenContext);
  const { accessToken, profile, isAuthenticated } = tokenCtx.state;
  const [uiLanguages] = useState(isDeveloper ? uiLangDev : uiLang);
  const [, setCompleted] = useGlobal('progress');
  const { showMessage } = useSnackBar();
  const { push } = useHistory();
  const getOfflineProject = useOfflnProjRead();
  const { getPlan } = usePlan();
  const [importOpen, setImportOpen] = useState(false);
  const [doSync, setDoSync] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const [, setBusy] = useGlobal('importexportBusy');
  const offlineSetup = useOfflineSetup();
  const { setMyProjRole } = useRole();
  const { setProjectType } = useProjectType();
  const LoadProjData = useLoadProjectData(t, doOrbitError, resetOrbitError);
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
    if (!offline && !isAuthenticated()) return;
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
      offlineSetup
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
    let fromUrl = localStorage.getItem(localUserKey(LocalKey.url));
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

    if (fromUrl && !/^\/profile|^\/work|^\/plan|^\/detail/.test(fromUrl))
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
            LoadProjData(projectId, () => {
              setPlan(planId);
              setProjectType(projectId);
              setMyProjRole(projectId);
            });
            const projRec = memory.cache.query((q: QueryBuilder) =>
              q.findRecord({ type: 'project', id: projectId })
            );
            if (projRec) {
              setProject(projectId);
              const orgId = related(projRec, 'organization') as string;
              setOrganization(orgId);
            }
          }
        }
      } else if (!/^\/profile/.test(fromUrl)) fromUrl = null;
    }
    push(fromUrl || '/team');
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

  if (!offline && !isAuthenticated()) return <Redirect to="/" />;
  if (view !== '') return <Redirect to={view} />;

  return (
    <div className={classes.root}>
      <AppHead {...props} />
      <div className={classes.container}>
        <Paper className={classes.paper}>
          <img src={logo} className={classes.icon} alt="logo" />
          <div>
            <Typography variant="h6" className={classes.message}>
              {inviteError}
            </Typography>
            <Typography variant="h6" className={classes.message}>
              {t.loadingTranscriber.replace('{0}', API_CONFIG.productName)}
            </Typography>
          </div>
          {loadComplete && inviteError && (
            <div className={classes.container}>
              <Button
                id="errCont"
                variant="contained"
                className={classes.button}
                onClick={continueWithCurrentUser}
              >
                {t.continueCurrentUser}
              </Button>

              <Button
                id="errLogout"
                variant="contained"
                className={classes.button}
                onClick={logoutAndTryAgain}
              >
                {t.logout}
              </Button>
            </div>
          )}
          {isElectron && importOpen && (
            <ImportTab
              syncBuffer={orbitFetchResults?.syncBuffer}
              syncFile={orbitFetchResults?.syncFile}
              isOpen={importOpen}
              onOpen={setImportOpen}
            />
          )}
        </Paper>
      </div>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
  ts: localStrings(state, { layout: 'shared' }),
  orbitFetchResults: state.orbit.fetchResults,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchLocalization: action.fetchLocalization,
      setLanguage: action.setLanguage,
      fetchOrbitData: action.fetchOrbitData,
      setExpireAt: action.setExpireAt,
      doOrbitError: action.doOrbitError,
      orbitComplete: action.orbitComplete,
      resetOrbitError: action.resetOrbitError,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Loading) as any;
