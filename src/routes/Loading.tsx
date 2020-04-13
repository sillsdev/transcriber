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
import { API_CONFIG } from '../api-variable';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import {
  AppBar,
  Toolbar,
  Typography,
  Paper,
  LinearProgress,
} from '@material-ui/core';
import UserMenu from '../components/UserMenu';
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
}

interface IProps extends IStateProps, IDispatchProps {
  auth: Auth;
}

export function Loading(props: IProps) {
  const { orbitLoaded, auth, setExpireAt, t } = props;
  const classes = useStyles();
  const { fetchOrbitData, fetchLocalization, setLanguage } = props;
  const [memory] = useGlobal('memory');
  const [schema] = useGlobal('schema');
  const [keyMap] = useGlobal('keyMap');
  const [backup] = useGlobal('backup');
  const [offline] = useGlobal('offline');
  const [bucket, setBucket] = useGlobal('bucket');
  const [remote, setRemote] = useGlobal('remote');
  const [user, setUser] = useGlobal('user');
  const [organization, setOrganization] = useGlobal('organization');
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [_project, setProject] = useGlobal('project');
  const [completed, setCompleted] = useState(0);
  const [newOrgParams, setNewOrgParams] = useState(
    localStorage.getItem('newOrg')
  );
  const [savedURL] = useState(localStorage.getItem('url') || '');
  const [view, setView] = useState('');
  const [message, setMessage] = useState(<></>);

  const handleUserMenuAction = (what: string) => {
    if (!/Close/i.test(what)) {
      if (/Clear/i.test(what)) {
        bucket.setItem('remote-requests', []);
      }
      setView(what);
    }
  };

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
          remoteId('organization', orgId, keyMap)
        );
      }
    }
  };

  const setDefaultOrg = async () => {
    let orgs: Organization[] = getOrgs(memory, user);
    var org = organization;
    if (org === '') {
      org =
        remoteIdGuid(
          'organization',
          localStorage.getItem('lastOrg') || '',
          keyMap
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
    if (navigator.language.split('-')[0]) {
      setLanguage(navigator.language.split('-')[0]);
    }
    localStorage.removeItem('inviteError');
    fetchLocalization();
    fetchOrbitData(
      schema,
      memory,
      keyMap,
      backup,
      auth,
      offline,
      setUser,
      setBucket,
      setRemote,
      setCompleted,
      InviteUser
    );
    if (!offline) {
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
            schema,
            memory,
            remote,
            setOrganization,
            setProject,
          }).then(() => setCompleted(100));
          setNewOrgParams(null);
        } else {
          setCompleted(100);
        }
        if (savedURL.length <= '/main'.length) setDefaultOrg();
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [completed, user]);

  if (!auth || !auth.isAuthenticated(offline)) return <Redirect to="/" />;

  if (/Logout/i.test(view)) return <Redirect to="/logout" />;

  if (orbitLoaded && completed === 100) {
    const userRec: User = GetUser(memory, user);
    if (
      !userRec.attributes.givenName ||
      !userRec.attributes.timezone ||
      !userRec.attributes.locale ||
      !uiLang.includes(userRec.attributes.locale)
    ) {
      return <Redirect to="/profile" />;
    }
    const deepLink = localStorage.getItem('url');
    return <Redirect to={deepLink ? deepLink : '/main'} />;
  }

  return (
    <div className={classes.root}>
      <AppBar position="fixed" className={classes.appBar} color="inherit">
        <Toolbar>
          <Typography variant="h6" noWrap>
            {API_CONFIG.isApp ? t.silTranscriber : t.silTranscriberAdmin}
          </Typography>
          <div className={classes.grow}>{'\u00A0'}</div>
          <UserMenu action={handleUserMenuAction} auth={auth} />
        </Toolbar>
      </AppBar>
      <div className={classes.container}>
        <Paper className={classes.paper}>
          <img src={logo} className={classes.icon} alt="logo" />
          <div>
            <Typography variant="h6" className={classes.message}>
              {localStorage.getItem('inviteError') || ''}
            </Typography>
            <Typography variant="h6" className={classes.message}>
              {API_CONFIG.isApp
                ? t.loadingTranscriber
                : t.loadingTranscriberAdmin}
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
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Loading) as any;
