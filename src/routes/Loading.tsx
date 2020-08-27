import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import Auth from '../auth/Auth';
import jwtDecode from 'jwt-decode';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  IState,
  IMainStrings,
  Organization,
  Invitation,
  User,
  ISharedStrings,
} from '../model';
import { TransformBuilder, QueryBuilder } from '@orbit/data';
import localStrings from '../selector/localize';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { Typography, Paper, LinearProgress } from '@material-ui/core';
import * as action from '../store';
import logo from './LogoNoShadow-4x.png';
import JSONAPISource from '@orbit/jsonapi';
import { uiLang, Online, localeDefault, parseQuery } from '../utils';
import { related, remoteId, hasAnyRelated, createOrg, GetUser } from '../crud';
import SnackBar from '../components/SnackBar';
import { isElectron } from '../api-variable';
import { AppHead } from '../components/App/AppHead';

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
  orbitLoaded: boolean;
}

interface IDispatchProps {
  fetchLocalization: typeof action.fetchLocalization;
  setLanguage: typeof action.setLanguage;
  fetchOrbitData: typeof action.fetchOrbitData;
  setExpireAt: typeof action.setExpireAt;
  doOrbitError: typeof action.doOrbitError;
}

interface IProps extends IStateProps, IDispatchProps {
  auth: Auth;
}

export function Loading(props: IProps) {
  const { orbitLoaded, auth, setExpireAt, t, ts } = props;
  const classes = useStyles();
  const {
    fetchOrbitData,
    fetchLocalization,
    setLanguage,
    doOrbitError,
  } = props;
  const [coordinator] = useGlobal('coordinator');
  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline');
  const [, setBucket] = useGlobal('bucket');
  const [, setRemote] = useGlobal('remote');
  const [, setFingerprint] = useGlobal('fingerprint');
  const [user, setUser] = useGlobal('user');
  const [organization, setOrganization] = useGlobal('organization');
  const [, setProject] = useGlobal('project');
  const [globalStore] = useGlobal();
  const [, setOrbitRetries] = useGlobal('orbitRetries');
  const [, setProjectsLoaded] = useGlobal('projectsLoaded');
  const [, setCoordinatorActivated] = useGlobal('coordinatorActivated');
  const [, setIsDeveloper] = useGlobal('developer');
  const [completed, setCompleted] = useState(0);
  const [newOrgParams, setNewOrgParams] = useState(
    localStorage.getItem('newOrg')
  );
  const [message, setMessage] = useState(<></>);

  const handleMessageReset = () => {
    setMessage(<></>);
  };
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
        setMessage(<span>{localStorage.getItem('inviteError') || ''}</span>);
      } else if (invite) {
        const orgId = related(invite, 'organization');
        setOrganization(orgId);
        localStorage.setItem(
          'lastOrg',
          remoteId('organization', orgId, memory.keyMap)
        );
      }
    }
  };

  useEffect(() => {
    const isDevValue = localStorage.getItem('developer');
    setIsDeveloper(isDevValue ? isDevValue === 'true' : false);
    if (!auth || !auth.isAuthenticated(offline)) return;
    setLanguage(localeDefault());
    localStorage.removeItem('inviteError');
    fetchLocalization();
    fetchOrbitData(
      coordinator,
      memory,
      auth,
      setUser,
      setBucket,
      setRemote,
      setFingerprint,
      setCompleted,
      setProjectsLoaded,
      setCoordinatorActivated,
      InviteUser,
      setOrbitRetries,
      globalStore
    );
    if (!isElectron && !offline) {
      const decodedToken: any = jwtDecode(auth.getAccessToken());
      setExpireAt(decodedToken.exp);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    if (orbitLoaded && completed === 90) {
      if (user && user !== '') {
        const userRec: User = GetUser(memory, user);
        if (userRec.attributes === null) {
          console.log('No user information.  Never expect to get here.');
        }
        const locale = userRec.attributes?.locale || 'en';
        if (locale) setLanguage(locale);

        if (
          organization === '' &&
          (newOrgParams !== null || !hasAnyRelated(userRec, 'groupMemberships'))
        ) {
          let orgRec: Organization;
          if (newOrgParams) {
            localStorage.removeItem('newOrg');
            const { orgId, orgName } = parseQuery(newOrgParams);
            orgRec = {
              type: 'organization',
              attributes: {
                name: orgName,
                SilId: orgId,
                publicByDefault: true,
              },
            } as any;
          } else {
            orgRec = {
              type: 'organization',
              attributes: {
                name: t.myWorkbench,
                description: t.defaultOrgDesc + userRec.attributes?.name || '',
                publicByDefault: true,
              },
            } as any;
          }
          Online((online) => {
            createOrg({
              orgRec,
              user,
              coordinator,
              online,
              setOrganization,
              setProject,
              doOrbitError,
            })
              .then(() => {
                setCompleted(100);
              })
              .catch((err: Error) => {
                if (!online) setMessage(<span>{ts.NoSaveOffline}</span>);
                else setMessage(<span>{err.message}</span>);
              });
          });
          setNewOrgParams(null);
        } else {
          setCompleted(100);
        }
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [completed, user]);

  if (!auth || !auth.isAuthenticated(offline)) return <Redirect to="/" />;

  if (orbitLoaded && completed === 100) {
    const userRec: User = GetUser(memory, user);
    if (
      !userRec?.attributes?.givenName ||
      !userRec?.attributes?.timezone ||
      !userRec?.attributes?.locale ||
      !uiLang.includes(userRec?.attributes?.locale)
    ) {
      return <Redirect to="/profile" />;
    }
    let fromUrl = localStorage.getItem('fromUrl');
    if (fromUrl && !/^\/work|^\/plan/.test(fromUrl)) fromUrl = null;
    return <Redirect to={fromUrl || '/team'} />;
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
              {t.loadingTranscriber}
            </Typography>
          </div>
          <LinearProgress variant="determinate" value={completed} />
        </Paper>
      </div>
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
  ts: localStrings(state, { layout: 'shared' }),
  orbitLoaded: state.orbit.loaded,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchLocalization: action.fetchLocalization,
      setLanguage: action.setLanguage,
      fetchOrbitData: action.fetchOrbitData,
      setExpireAt: action.setExpireAt,
      doOrbitError: action.doOrbitError,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Loading) as any;
