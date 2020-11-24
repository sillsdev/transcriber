import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import Auth from '../auth/Auth';
import { Redirect, useHistory } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  IState,
  IMainStrings,
  Invitation,
  User,
  ISharedStrings,
  IFetchResults,
} from '../model';
import { useCoordinator } from '../crud';
import { TransformBuilder, QueryBuilder } from '@orbit/data';
import localStrings from '../selector/localize';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { Typography, Paper, LinearProgress } from '@material-ui/core';
import * as action from '../store';
import logo from './LogoNoShadow-4x.png';
import JSONAPISource from '@orbit/jsonapi';
import {
  uiLang,
  uiLangDev,
  localeDefault,
  localUserKey,
  LocalKey,
  currentDateTime,
} from '../utils';
import { related, GetUser, LoadData } from '../crud';
import { useSnackBar } from '../hoc/SnackBar';
import { API_CONFIG, isElectron } from '../api-variable';
import { AppHead } from '../components/App/AppHead';
import { useOfflnProjRead } from '../crud/useOfflnProjRead';
import ImportTab from '../components/ImportTab';

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
    paper: theme.mixins.gutters({
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
    }) as any,
    button: {},
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
}

interface IProps extends IStateProps, IDispatchProps {
  auth: Auth;
}

export function Loading(props: IProps) {
  const { orbitFetchResults, auth, t } = props;
  const classes = useStyles();
  const {
    fetchOrbitData,
    orbitComplete,
    doOrbitError,
    fetchLocalization,
    setLanguage,
  } = props;
  const coordinator = useCoordinator();
  const [memory] = useGlobal('memory');
  const [backup] = useGlobal('backup');
  const [remote] = useGlobal('remote');
  const [offline] = useGlobal('offline');
  const [, setBucket] = useGlobal('bucket');
  const [, setRemote] = useGlobal('remote');
  const [fingerprint] = useGlobal('fingerprint');
  const [user, setUser] = useGlobal('user');
  const [, setOrganization] = useGlobal('organization');
  const [globalStore] = useGlobal();
  const [, setOrbitRetries] = useGlobal('orbitRetries');
  const [, setProjectsLoaded] = useGlobal('projectsLoaded');
  const [orbitLoaded, setLoadComplete] = useGlobal('loadComplete');
  const [, setCoordinatorActivated] = useGlobal('coordinatorActivated');
  const [isDeveloper] = useGlobal('developer');
  const [uiLanguages] = useState(isDeveloper ? uiLangDev : uiLang);
  const [completed, setCompleted] = useState(0);
  const { showMessage } = useSnackBar();
  const { push } = useHistory();
  const getOfflineProject = useOfflnProjRead();
  const [importOpen, setImportOpen] = useState(false);
  const [doSync, setDoSync] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const [, setBusy] = useGlobal('importexportBusy');

  //remote is passed in because it wasn't always available in global
  const InviteUser = async (newremote: JSONAPISource, userEmail: string) => {
    const inviteId = localStorage.getItem('inviteId');
    localStorage.removeItem('inviteId');
    var inviteError = '';

    //filter will be passed to api which will lowercase the email before comparison
    var allinvites: Invitation[] = (await newremote.query((q: QueryBuilder) =>
      q
        .findRecords('invitation')
        .filter(
          { attribute: 'email', value: userEmail },
          { attribute: 'accepted', value: false }
        )
    )) as any;
    allinvites.forEach(async (invitation) => {
      await newremote.update((t: TransformBuilder) =>
        t.replaceAttribute(invitation, 'accepted', true)
      );
    });
    if (inviteId) {
      let invite = allinvites.find(
        (i) => i.attributes.silId === parseInt(inviteId)
      );
      if (!invite) {
        try {
          const thisinvite: Invitation[] = (await newremote.query(
            (q: QueryBuilder) =>
              q
                .findRecords('invitation')
                .filter({ attribute: 'silId', value: parseInt(inviteId) })
          )) as any;

          //if previously accepted just roll with it
          if (
            thisinvite[0].attributes.email.toLowerCase() !==
            userEmail.toLowerCase()
          ) {
            /* they must have logged in with another email */
            inviteError = t.inviteError;
          } else {
            invite = thisinvite[0];
          }
        } catch {
          inviteError = t.deletedInvitation;
        }
      }
      if (inviteError !== '') {
        localStorage.setItem('inviteError', inviteError);
        showMessage(localStorage.getItem('inviteError') || '');
      } else if (invite) {
        const orgId = related(invite, 'organization');
        setOrganization(orgId);
      }
    }
  };

  useEffect(() => {
    if (!offline && !auth?.isAuthenticated()) return;
    setLanguage(localeDefault(isDeveloper));
    localStorage.removeItem('inviteError');
    fetchLocalization();
    fetchOrbitData(
      coordinator,
      memory,
      auth,
      fingerprint,
      setUser,
      setBucket,
      setRemote,
      setProjectsLoaded,
      setCoordinatorActivated,
      setOrbitRetries,
      globalStore,
      getOfflineProject
    );
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    if (orbitFetchResults) {
      //fetchOrbitData is complete

      //set user language
      const userRec: User = GetUser(memory, user);
      if (userRec.attributes === null) {
        console.log('No user information.  Never expect to get here.');
      }
      const locale = userRec.attributes?.locale || 'en';
      if (locale) setLanguage(locale);

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

  useEffect(() => {
    const LoadComplete = () => {
      setCompleted(100);
      setLoadComplete(true);
      orbitComplete();
    };
    const finishRemoteLoad = () => {
      remote
        .pull((q) => q.findRecords('currentuser'))
        .then((tr) => {
          const user = (tr[0].operations[0] as any).record;
          InviteUser(remote, user?.attributes?.email || 'neverhere').then(
            () => {
              setCompleted(10);
              LoadData(memory, backup, remote, setCompleted, doOrbitError).then(
                () => {
                  LoadComplete();
                }
              );
            }
          );
        });
    };
    //sync was either not needed, or is done
    if (syncComplete && orbitFetchResults) {
      if (orbitFetchResults.goRemote) {
        localStorage.setItem(
          localUserKey(LocalKey.time, memory),
          currentDateTime()
        );
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

  if (!offline && !auth?.isAuthenticated()) return <Redirect to="/" />;

  if (orbitLoaded && completed === 100) {
    const userRec: User = GetUser(memory, user);
    if (
      !userRec?.attributes?.givenName ||
      !userRec?.attributes?.timezone ||
      !userRec?.attributes?.locale ||
      !uiLanguages.includes(userRec?.attributes?.locale)
    ) {
      return <Redirect to="/profile" />;
    }
    let fromUrl = localStorage.getItem(localUserKey(LocalKey.url, memory));
    if (fromUrl && !/^\/profile|^\/work|^\/plan/.test(fromUrl)) fromUrl = null;
    push(fromUrl || '/team');
  }

  return (
    <div className={classes.root}>
      <AppHead {...props} />
      <div className={classes.container}>
        <Paper className={classes.paper}>
          <img src={logo} className={classes.icon} alt="logo" />
          <div>
            <Typography variant="h6" className={classes.message}>
              {localStorage.getItem('inviteError') || ''}
            </Typography>
            <Typography variant="h6" className={classes.message}>
              {t.loadingTranscriber.replace('{0}', API_CONFIG.productName)}
            </Typography>
          </div>
          {isElectron && importOpen && (
            <ImportTab
              syncBuffer={orbitFetchResults?.syncBuffer}
              syncFile={orbitFetchResults?.syncFile}
              auth={auth}
              isOpen={importOpen}
              onOpen={setImportOpen}
            />
          )}
          <LinearProgress variant="determinate" value={completed} />
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
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Loading) as any;
