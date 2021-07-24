import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { IState, IWelcomeStrings, User } from '../model';
import localStrings from '../selector/localize';
import * as action from '../store';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Typography, Button, Paper, Grid } from '@material-ui/core';
import Auth from '../auth/Auth';
import { Online, localeDefault } from '../utils';
import { isElectron } from '../api-variable';
import AppHead from '../components/App/AppHead';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import MemorySource from '@orbit/memory';
import ImportTab from '../components/ImportTab';
import { IAxiosStatus } from '../store/AxiosStatus';
import OfflineIcon from '@material-ui/icons/CloudOff';
import OnlineIcon from '@material-ui/icons/CloudQueue';
import { connect } from 'react-redux';
import moment from 'moment';
import { AddRecord } from '../model/baseModel';
import { useOfflineSetup } from '../crud';
import { ChoiceHead } from '../control/ChoiceHead';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      flexGrow: 1,
      '& .MuiListSubheader-root': {
        lineHeight: 'unset',
      },
      '& .MuiListItemIcon-root': {
        minWidth: '30px',
      },
    },
    paper: {
      padding: theme.spacing(3),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
    },
    sectionHead: {
      fontSize: '16pt',
      paddingTop: theme.spacing(4),
      paddingBottom: theme.spacing(2),
    },
    button: {
      marginRight: '10px',
      marginBottom: '5px',
    },
    icon: {
      marginRight: theme.spacing(1),
    },
    action: {
      padding: theme.spacing(2),
      textAlign: 'center',
      alignSelf: 'center',
    },
  })
);

interface IStateProps {
  t: IWelcomeStrings;
  importStatus: IAxiosStatus | undefined;
}

interface IDispatchProps {
  fetchLocalization: typeof action.fetchLocalization;
  setLanguage: typeof action.setLanguage;
}

interface IProps extends IStateProps, IDispatchProps {
  auth: Auth;
}

export function Welcome(props: IProps) {
  const { auth, t, importStatus } = props;
  const classes = useStyles();
  const offlineSetup = useOfflineSetup();
  const { fetchLocalization, setLanguage } = props;
  const [user, setUser] = useGlobal('user');
  const [isDeveloper] = useGlobal('developer');
  const [, setConnected] = useGlobal('connected');
  const [whichUsers, setWhichUsers] = useState<string | null>(null);
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as MemorySource;
  const [importOpen, setImportOpen] = useState(false);
  const [hasOfflineUsers, setHasOfflineUsers] = useState(false);
  const checkUsers = (autoGo: boolean, prevChoice?: string) => {
    const users = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('user')
    ) as User[];
    var offlineUsers = users.filter((u) => u.keys?.remoteId === undefined);
    setHasOfflineUsers(offlineUsers.length > 0);

    const lastUserId = localStorage.getItem('user-id');
    console.log('lastUserId', lastUserId);

    if (lastUserId !== null) {
      const selected = users.filter((u) => u.id === lastUserId);
      console.log('lastUserId', lastUserId, selected.length, autoGo);
      if (selected.length > 0) {
        setUser(lastUserId);
        if (autoGo) {
          setWhichUsers(
            selected[0]?.keys?.remoteId !== undefined ? 'online' : 'offline'
          );
          return;
        }
      }
    }
    //I don't have a user id, but I do have a list to go to...
    if (prevChoice) {
      setWhichUsers(prevChoice);
      return;
    }
    //I don't have a previous choice, but I may only have one choice...
    var onlineUsers = users.filter((u) => u.keys?.remoteId !== undefined);
    //if we're supposed to choose and we only have one choice...go
    if (
      autoGo &&
      (onlineUsers.length > 0 || offlineUsers.length > 0) &&
      !(onlineUsers.length > 0 && offlineUsers.length > 0)
    ) {
      setWhichUsers(onlineUsers.length > 0 ? 'online' : 'offline');
    }
  };

  useEffect(() => {
    setLanguage(localeDefault(isDeveloper));
    fetchLocalization();
    Online((connected) => {
      setConnected(connected);
    }, auth);
    const choice = localStorage.getItem('offlineAdmin');
    console.log('already had a choice', choice);
    if (choice !== null) {
      if (choice === 'choose') checkUsers(false);
      else checkUsers(true, choice === 'true' ? 'offline' : 'online');
    } else {
      checkUsers(true);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    if (importStatus?.complete) checkUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importStatus]);

  const handleGoOnline = () => {
    handleOfflineChange('online');
  };

  const handleGoOffline = () => {
    handleOfflineChange('offline');
  };
  const handleQuickOnline = () => {
    localStorage.setItem('autoaddProject', 'true');
    handleGoOnline();
  };
  const addQuickUser = async () => {
    let userRec: User = {
      type: 'user',
      attributes: {
        name: t.quickGiven + ' ' + t.quickFamily,
        givenName: t.quickGiven,
        familyName: t.quickFamily,
        email: '',
        phone: '',
        timezone: moment.tz.guess(),
        locale: localeDefault(isDeveloper),
        isLocked: false,
        uilanguagebcp47: '',
        digestPreference: false,
        newsPreference: false,
      },
    } as any;
    await memory.update((t: TransformBuilder) =>
      AddRecord(t, userRec, user, memory)
    );
    await offlineSetup();
    return userRec.id;
  };
  const handleQuickOffline = () => {
    localStorage.setItem('autoaddProject', 'true');

    if (hasOfflineUsers) {
      const users = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('user')
      ) as User[];
      var quickUsers = users.filter(
        (u) =>
          u.keys?.remoteId === undefined &&
          u.attributes?.givenName === t.quickGiven &&
          u.attributes?.familyName === t.quickFamily
      );

      if (quickUsers.length !== 0) {
        setUser(quickUsers[0].id);
        handleGoOffline();
        return;
      }
    }
    addQuickUser().then((id) => {
      setUser(id);
      handleGoOffline();
    });
  };
  const handleOfflineChange = (target: string) => {
    setWhichUsers(target);
    localStorage.setItem(
      'offlineAdmin',
      target === 'offline' ? 'true' : 'false'
    );
  };
  const handleImport = () => {
    setImportOpen(true);
  };

  const t2 = {
    admin: 'Setup up a team project',
    adminTip:
      'Setup the project, dividing work into passages that can be assigned to various transcribers and editors.  Transcribers and editors can work online or offline by downloading or importing the project.',
    team: 'Work in a team project',
    teamTip:
      'A project has been setup online.  Transcribers and editors can work online, offline by downloading the project, or offline by importing it.',
    keyFactor: 'Key Factor',
    online: 'Work Online',
    offline: 'Work Offline',
    import: 'Import Project',
    alone: 'Work alone',
  };
  const adminFactors = ['Requires Internet connection'];
  const teamFactors = ['Project has been set up online'];
  const quickFactors = ['Projects cannot be changed to team projects later'];

  const OnlineButton = ({
    id,
    onClick,
  }: {
    id: string;
    onClick: () => void;
  }) => (
    <Button
      id={id}
      variant="outlined"
      color="primary"
      className={classes.button}
      onClick={onClick}
    >
      <OnlineIcon className={classes.icon} />
      {t2.online}
    </Button>
  );
  const OfflineButton = ({
    id,
    onClick,
    txt,
  }: {
    id: string;
    onClick: () => void;
    txt?: string;
  }) => (
    <Button
      id={id}
      variant="outlined"
      color="primary"
      className={classes.button}
      onClick={onClick}
    >
      <OfflineIcon className={classes.icon} />
      {txt ? txt : t2.offline}
    </Button>
  );

  if (!isElectron || whichUsers !== null) {
    return <Redirect to={'/access/' + whichUsers} />;
  }

  return (
    <div className={classes.root}>
      <AppHead {...props} />
      <Typography className={classes.sectionHead}>Filler</Typography>

      {isElectron && (
        <Paper className={classes.paper}>
          <Typography id="welcome" className={classes.sectionHead}>
            {t.title}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={8}>
              <ChoiceHead
                title={t2.admin}
                prose={t2.adminTip}
                keyFactorTitle={t2.keyFactor}
                factors={adminFactors}
              />
            </Grid>
            <Grid item xs={4} className={classes.action}>
              <OnlineButton id="adminonline" onClick={handleGoOnline} />
            </Grid>
            <Grid item xs={8}>
              <ChoiceHead
                title={t2.team}
                prose={t2.teamTip}
                keyFactorTitle={t2.keyFactor}
                factors={teamFactors}
              />
            </Grid>
            <Grid item xs={4} className={classes.action}>
              <OnlineButton id="teamonline" onClick={handleGoOnline} />
              {hasOfflineUsers && (
                <OfflineButton id="teamoffline" onClick={handleGoOffline} />
              )}
              <OfflineButton
                id="teamimport"
                onClick={handleImport}
                txt={t2.import}
              />
            </Grid>
            <Grid item xs={8}>
              <ChoiceHead
                title={t2.alone}
                prose={''}
                keyFactorTitle={t2.keyFactor}
                factors={quickFactors}
              />
            </Grid>
            <Grid item xs={4} className={classes.action}>
              <OnlineButton id="aloneonline" onClick={handleQuickOnline} />
              <OfflineButton id="aloneoffline" onClick={handleQuickOffline} />
            </Grid>
          </Grid>
        </Paper>
      )}
      {importOpen && (
        <ImportTab auth={auth} isOpen={importOpen} onOpen={setImportOpen} />
      )}
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'welcome' }),
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

export default connect(mapStateToProps, mapDispatchToProps)(Welcome) as any;
