import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { IState, IAccessStrings, User } from '../model';
import localStrings from '../selector/localize';
import * as action from '../store';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Typography, Button, Paper, IconButton } from '@material-ui/core';
import Auth from '../auth/Auth';
import { Online, localeDefault } from '../utils';
import { isElectron } from '../api-variable';
import AppHead from '../components/App/AppHead';
import HelpIcon from '@material-ui/icons/Help';
import { QueryBuilder } from '@orbit/data';
import MemorySource from '@orbit/memory';
import ImportTab from '../components/ImportTab';
import { IAxiosStatus } from '../store/AxiosStatus';
import OfflineIcon from '@material-ui/icons/CloudOff';
import OnlineIcon from '@material-ui/icons/CloudQueue';
import { connect } from 'react-redux';
import { LightTooltip } from '../control';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'block',
      width: '100%',
    },
    container: {
      display: 'block',
      justifyContent: 'center',
    },
    paper: {
      padding: theme.spacing(3),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      widith: '80%',
    },
    sectionHead: {
      fontSize: '16pt',
      paddingTop: theme.spacing(4),
      paddingBottom: theme.spacing(2),
    },
    button: {
      marginRight: '0px',
      minWidth: theme.spacing(20),
    },
    icon: {
      marginRight: theme.spacing(1),
    },
    helpIcon: {
      paddingLeft: '1px',
    },
    iconlabel: {
      marginBottom: '5px',
      marginTop: '8px',
    },
    col: {
      display: 'flex',
      flexDirection: 'column',
    },
  })
);

interface IStateProps {
  t: IAccessStrings;
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
  const { fetchLocalization, setLanguage } = props;
  const [isDeveloper] = useGlobal('developer');
  const [, setConnected] = useGlobal('connected');
  const [whichUsers, setWhichUsers] = useState<string | null>(null);
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as MemorySource;
  const [importOpen, setImportOpen] = useState(false);
  const [hasOfflineUsers, setHasOfflineUsers] = useState(false);
  const checkUsers = (autoGo: boolean) => {
    const users = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('user')
    ) as User[];
    var onlineUsers = users.filter((u) => u.keys?.remoteId !== undefined);
    var offlineUsers = users.filter((u) => u.keys?.remoteId === undefined);
    console.log(
      'onlineUsers',
      onlineUsers.length,
      'offlineUsers',
      offlineUsers.length
    );
    setHasOfflineUsers(offlineUsers.length > 0);
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
    if (choice !== null)
      if (choice === 'choose') checkUsers(false);
      else setWhichUsers(choice === 'true' ? 'offline' : 'online');
    else {
      checkUsers(true);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    if (importStatus?.complete) checkUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importStatus]);
  const handleHelpOnlineAdmin = () => {};

  const handleGoOnline = () => {
    handleOfflineChange('online');
  };

  const handleGoOffline = () => {
    handleOfflineChange('offline');
  };
  const handleOfflineChange = (target: string) => {
    console.log(target);
    setWhichUsers(target);
    localStorage.setItem(
      'offlineAdmin',
      target === 'offline' ? 'true' : 'false'
    );
  };
  const handleImport = () => {
    setImportOpen(true);
  };
  if (!isElectron || whichUsers !== null) {
    return <Redirect to={'/access/' + whichUsers} />;
  }
  return (
    <div className={classes.root}>
      <AppHead {...props} />
      {isElectron && (
        <div className={classes.container}>
          <Typography className={classes.sectionHead}>Filler</Typography>
          <Paper className={classes.paper}>
            <Typography id="welcome" className={classes.sectionHead}>
              Welcome
            </Typography>
            <div>
              <Paper>
                <Typography id="admin" className={classes.sectionHead}>
                  I'm an Administrator
                </Typography>
                <div>
                  <Button
                    id="adminonline"
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={handleGoOnline}
                  >
                    <OnlineIcon className={classes.icon} />
                    {'For Online or Occassionally Connected Projects'}
                  </Button>
                  <LightTooltip title="All project administration must be done online.  Projects can be worked on online, marked as 'available offline' while online and downloaded, or exported to a file and imported on to an offline computer.  Changes made offline can be automatically synced if the computer comes online, or changes can be exported and imported by the online Admin.">
                    <IconButton
                      id="adminonlinehelp"
                      className={classes.helpIcon}
                      color="primary"
                      aria-label="helponlineadmin"
                      onClick={handleHelpOnlineAdmin}
                    >
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </LightTooltip>
                </div>
                <div>
                  <Button
                    id="adminoffline"
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={handleGoOffline}
                  >
                    <OfflineIcon className={classes.icon} />
                    {'For Offline Single User Projects'}
                  </Button>
                  <LightTooltip title="The project is stored on your computer. You cannot set up a team.  You can export the project and import it on to another computer, but all changes will be done under your user.  Changes can be exported and then imported on to the master computer.">
                    <IconButton
                      id="adminofflinehelp"
                      className={classes.helpIcon}
                      color="primary"
                      aria-label="helponlineadmin"
                      onClick={handleHelpOnlineAdmin}
                    >
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </LightTooltip>
                </div>
              </Paper>
              <Paper>
                <Typography className={classes.sectionHead}>
                  I'm a Team Member
                </Typography>
                <div>
                  <Button
                    id="memberonline"
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={handleGoOnline}
                  >
                    <OnlineIcon className={classes.icon} />
                    {'For Projects Available Online'}
                  </Button>
                  <LightTooltip title="Projects can be worked on online, marked as 'available offline' while online and downloaded, or exported to a file and imported on to an offline computer.  Changes made offline can be automatically synced if the computer comes online, or changes can be exported and imported by the online Admin.">
                    <IconButton
                      id="memberonlinehelp"
                      className={classes.helpIcon}
                      color="primary"
                      aria-label="helponlineadmin"
                      onClick={handleHelpOnlineAdmin}
                    >
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </LightTooltip>
                </div>
                {hasOfflineUsers && (
                  <div>
                    <Button
                      id="memberoffline"
                      variant="contained"
                      color="primary"
                      className={classes.button}
                      onClick={handleGoOffline}
                    >
                      <OfflineIcon className={classes.icon} />
                      {'For Projects Only Available Online'}
                    </Button>
                    <LightTooltip title="Changes must be exported and imported to the master computer.">
                      <IconButton
                        id="memberofflinehelp"
                        className={classes.helpIcon}
                        color="primary"
                        aria-label="helponlineadmin"
                        onClick={handleHelpOnlineAdmin}
                      >
                        <HelpIcon fontSize="small" />
                      </IconButton>
                    </LightTooltip>
                  </div>
                )}
                <div>
                  <Button
                    id="memberimport"
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={handleImport}
                  >
                    {'For projects with an available import file'}
                  </Button>
                  <LightTooltip title="Either Online or Offline Projects can be imported to be worked on offline.  If the project was created online, changes made offline can be automatically synced if the computer comes online, or changes can be exported and imported by the online Admin.  If the project was started offline, changes must be exported and imported to the master computer.">
                    <IconButton
                      id="memberimporthelp"
                      className={classes.helpIcon}
                      color="primary"
                      aria-label="helponlineadmin"
                      onClick={handleHelpOnlineAdmin}
                    >
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </LightTooltip>
                </div>
              </Paper>
              <Paper>
                <Typography className={classes.sectionHead}>
                  Quick Transcribe
                </Typography>
                <div>
                  <Button
                    id="quickonline"
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={handleGoOffline}
                  >
                    <OnlineIcon className={classes.icon} />
                    {'With Online Access'}
                  </Button>
                  <LightTooltip title="After login, you will choose a project type, upload or record audio, and start transcribing as soon as possible.  Your audio will be stored online.">
                    <IconButton
                      id="quickonlinehelp"
                      className={classes.helpIcon}
                      color="primary"
                      aria-label="helponlineadmin"
                      onClick={handleHelpOnlineAdmin}
                    >
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </LightTooltip>
                </div>
                <div>
                  <Button
                    id="quickoffline"
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={handleGoOffline}
                  >
                    <OfflineIcon className={classes.icon} />
                    {'Offline Only Access'}
                  </Button>
                  <LightTooltip title="We will create a default user, you will choose a project type, import or record audio, and start transcribing as soon as possible.  Your audio will be stored on your computer.">
                    <IconButton
                      id="quickofflinehelp"
                      className={classes.helpIcon}
                      color="primary"
                      aria-label="helponlineadmin"
                      onClick={handleHelpOnlineAdmin}
                    >
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </LightTooltip>
                </div>
              </Paper>
            </div>
          </Paper>
        </div>
      )}
      {importOpen && (
        <ImportTab auth={auth} isOpen={importOpen} onOpen={setImportOpen} />
      )}
    </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(Welcome) as any;
