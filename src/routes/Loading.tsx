import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import Auth from '../auth/Auth';
import jwtDecode from 'jwt-decode';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState, IMainStrings, Organization, Invitation, User } from '../model';
import { TransformBuilder, QueryBuilder } from '@orbit/data';
import localStrings from '../selector/localize';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { Typography, Paper, LinearProgress } from '@material-ui/core';
import * as action from '../store';
import logo from './LogoNoShadow-4x.png';
import JSONAPISource from '@orbit/jsonapi';
import { parseQuery } from '../utils/parseQuery';
import {
  related,
  hasAnyRelated,
  setDefaultProj,
  CreateOrg,
  uiLang,
  remoteId,
  GetUser,
  remoteIdGuid,
} from '../utils';
import SnackBar from '../components/SnackBar';
import { getOrgs } from '../utils/getOrgs';
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
  const { orbitLoaded, auth, setExpireAt, t } = props;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_bucket, setBucket] = useGlobal('bucket');
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [_remote, setRemote] = useGlobal('remote');

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [_fingerprint, setFingerprint] = useGlobal('fingerprint');
  const [user, setUser] = useGlobal('user');
  const [organization, setOrganization] = useGlobal('organization');
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [_project, setProject] = useGlobal('project');
  const [globalStore] = useGlobal();
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [_orbitRetries, setOrbitRetries] = useGlobal('orbitRetries');
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [_projectsLoaded, setProjectsLoaded] = useGlobal('projectsLoaded');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_coordinatorActivated, setCoordinatorActivated] = useGlobal(
    'coordinatorActivated'
  );
  const [isDeveloper, setIsDeveloper] = useGlobal('developer');
  const [completed, setCompleted] = useState(0);
  const [newOrgParams, setNewOrgParams] = useState(
    localStorage.getItem('newOrg')
  );
  const [savedURL] = useState(localStorage.getItem('url') || '');
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

  const setDefaultOrg = async () => {
    let orgs: Organization[] = getOrgs(memory, user);
    var org = organization;
    if (org === '' || orgs.findIndex((o) => o.id === org) < 0) {
      org =
        remoteIdGuid(
          'organization',
          localStorage.getItem('lastOrg') || '',
          memory.keyMap
        ) || '';
    }
    if (org === '') {
      orgs = orgs
        .filter((o) => o.attributes)
        .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1));
      if (orgs.length > 0) {
        org = orgs[0].id;
      }
    }
    setOrganization(org);
    if (org !== '') setDefaultProj(org, memory, setProject);
  };

  useEffect(() => {
    const isDevValue = localStorage.getItem('developer');
    setIsDeveloper(isDevValue ? isDevValue === 'true' : false);
    if (!auth || !auth.isAuthenticated(offline)) return;
    if (navigator.language.split('-')[0]) {
      setLanguage(navigator.language.split('-')[0]);
    }
    localStorage.removeItem('inviteError');
    fetchLocalization();
    fetchOrbitData(
      coordinator,
      memory,
      auth,
      isElectron || offline,
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
          CreateOrg({
            orgRec,
            user,
            coordinator,
            setOrganization,
            setProject,
            doOrbitError,
          }).then(() => setCompleted(100));
          setNewOrgParams(null);
        } else {
          setCompleted(100);
        }
        const urlLen = Math.min(savedURL.length, 5);
        if (savedURL.slice(0, urlLen) === '/main'.slice(0, urlLen))
          setDefaultOrg();
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
    if (isDeveloper) return <Redirect to={'/team'} />;
    const deepLink = localStorage.getItem('url');
    return <Redirect to={deepLink ? deepLink : '/main'} />;
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
