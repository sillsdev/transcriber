import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import Auth from '../auth/Auth';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState, IMainStrings, Organization, Invitation } from '../model';
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
import logo from './transcriber9.png';
import { parseQuery, IParsedArgs } from '../utils/parseQuery';

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
    }),
    button: {},
    icon: {
      alignSelf: 'center',
      width: '256px',
      height: '256px',
    },
    message: {
      alignSelf: 'center',
    },
  })
);

interface IStateProps {
  t: IMainStrings;
  orbitLoaded: boolean;
}

interface IDispatchProps {
  fetchLocalization: typeof action.fetchLocalization;
  fetchLangTags: typeof action.fetchLangTags;
  setLanguage: typeof action.setLanguage;
  fetchOrbitData: typeof action.fetchOrbitData;
  fetchScriptFonts: typeof action.fetchScriptFonts;
}

interface IProps extends IStateProps, IDispatchProps {
  auth: Auth;
}

export function Loading(props: IProps) {
  const { orbitLoaded, auth, t } = props;
  const classes = useStyles();
  const {
    fetchOrbitData,
    fetchLocalization,
    fetchLangTags,
    fetchScriptFonts,
    setLanguage,
  } = props;
  const { isAuthenticated } = auth;
  const [memory] = useGlobal('memory');
  const [schema] = useGlobal('schema');
  const [keyMap] = useGlobal('keyMap');
  const [bucket, setBucket] = useGlobal('bucket');
  const [remote, setRemote] = useGlobal('remote');
  const [user, setUser] = useGlobal('user');
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [_organization, setOrganization] = useGlobal('organization');
  const [completed, setCompleted] = useState(0);
  const [newOrgParams, setNewOrgParams] = useState(
    localStorage.getItem('newOrg')
  );
  const [view, setView] = useState('');

  const handleUserMenuAction = (what: string) => {
    if (!/Close/i.test(what)) {
      if (/Clear/i.test(what)) {
        bucket.setItem('remote-requests', []);
      }
      setView(what);
    }
  };

  const ReloadOrgTables = async () => {
    await remote
      .pull(q => q.findRecords('organization'))
      .then(transform => memory.sync(transform));
    await remote
      .pull(q => q.findRecords('organizationmembership'))
      .then(transform => memory.sync(transform));
    await remote
      .pull(q => q.findRecords('group'))
      .then(transform => memory.sync(transform));
    await remote
      .pull(q => q.findRecords('groupmembership'))
      .then(transform => memory.sync(transform));
  };

  const CreateOrg = async (props: IParsedArgs) => {
    const { orgId, orgName } = props;
    if (!localStorage.getItem('newOrg')) return;
    localStorage.removeItem('newOrg');

    let organization: Organization = {
      type: 'organization',
      attributes: {
        name: orgName,
        SilId: orgId,
        publicByDefault: true,
      },
    } as any;
    schema.initializeRecord(organization);

    await remote.update((t: TransformBuilder) => [
      t.addRecord(organization),
      t.replaceRelatedRecord(
        { type: 'organization', id: organization.id },
        'owner',
        {
          type: 'user',
          id: user,
        }
      ),
    ]);
    await ReloadOrgTables();
    const newOrgRec: Organization[] = memory.cache.query((q: QueryBuilder) =>
      q
        .findRecords('organization')
        .filter({ attribute: 'name', value: orgName })
    );
    setOrganization(newOrgRec[0].id);
    setNewOrgParams(null);
  };

  const InviteUser = async () => {
    const inviteId = localStorage.getItem('inviteId');
    if (!inviteId) return;
    localStorage.removeItem('inviteId');
    const invite: Invitation[] = memory.cache.query((q: QueryBuilder) =>
      q
        .findRecords('invitation')
        .filter({ attribute: 'silId', value: parseInt(inviteId) })
    );
    if (invite.length > 0) {
      await remote.update((t: TransformBuilder) =>
        t.replaceAttribute(invite[0], 'accepted', true)
      );
      await ReloadOrgTables();
    }
  };

  useEffect(() => {
    setLanguage(navigator.language.split('-')[0]);
    fetchLocalization();
    fetchLangTags();
    fetchScriptFonts();
    fetchOrbitData(
      schema,
      memory,
      keyMap,
      auth,
      setUser,
      setBucket,
      setRemote,
      setCompleted
    );
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    if (completed === 100) {
      if (newOrgParams) {
        CreateOrg(parseQuery(newOrgParams));
      }
      InviteUser();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [completed]);

  if (!isAuthenticated()) return <Redirect to="/" />;

  if (/Logout/i.test(view)) {
    return <Redirect to="/logout" />;
  }

  if (
    orbitLoaded &&
    (completed === 100 || API_CONFIG.offline) &&
    newOrgParams === null
  ) {
    return <Redirect to="/main" />;
  }

  return (
    <div className={classes.root}>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6" noWrap>
            {t.silTranscriberAdmin}
          </Typography>
          <div className={classes.grow}>{'\u00A0'}</div>
          <UserMenu action={handleUserMenuAction} auth={auth} />
        </Toolbar>
      </AppBar>
      <div className={classes.container}>
        <Paper className={classes.paper}>
          <img src={logo} className={classes.icon} alt="logo" />
          <Typography variant="h6" className={classes.message}>
            {t.loadingTranscriber}
          </Typography>
          <LinearProgress variant="determinate" value={completed} />
        </Paper>
      </div>
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
      fetchLangTags: action.fetchLangTags,
      fetchScriptFonts: action.fetchScriptFonts,
    },
    dispatch
  ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Loading) as any;
