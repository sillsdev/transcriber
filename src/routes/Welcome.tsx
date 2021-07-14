import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState, IAccessStrings, User } from '../model';
import localStrings from '../selector/localize';
import * as action from '../store';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Typography,
  Button,
  Paper,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import Auth from '../auth/Auth';
import { Online, localeDefault } from '../utils';
import { isElectron } from '../api-variable';
import AppHead from '../components/App/AppHead';
import HelpIcon from '@material-ui/icons/Help';
import { QueryBuilder } from '@orbit/data';
import MemorySource from '@orbit/memory';
import ImportTab from '../components/ImportTab';
import { IAxiosStatus } from '../store/AxiosStatus';

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
            <Typography className={classes.sectionHead}>Welcome</Typography>
            <div>
              <Paper>
                <Typography className={classes.sectionHead}>
                  I'm an administrator
                </Typography>
                <Button
                  id="accessLogin"
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  onClick={handleGoOnline}
                >
                  {'Create/Manage an Online project'}
                </Button>
                <Tooltip title="admin online. collaboration etc etc">
                  <IconButton
                    className={classes.helpIcon}
                    color="primary"
                    aria-label="helponlineadmin"
                    onClick={handleHelpOnlineAdmin}
                  >
                    <HelpIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Button
                  id="accessLogin"
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  onClick={handleGoOffline}
                >
                  {'Create/Manage an offline project'}
                </Button>
              </Paper>
              <Paper>
                <Typography className={classes.sectionHead}>
                  I'm a transcriber/editor
                </Typography>
                <Button
                  id="accessLogin"
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  onClick={handleGoOnline}
                >
                  {'I have an online login'}
                </Button>
                {hasOfflineUsers && (
                  <Button
                    id="accessLogin"
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={handleGoOffline}
                  >
                    {'I already have an offline project'}
                  </Button>
                )}
                <Button
                  id="accessLogin"
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  onClick={handleImport}
                >
                  {'My admin gave me a project to import'}
                </Button>
              </Paper>
              <Paper>
                <Typography className={classes.sectionHead}>
                  I just want to transcribe something
                </Typography>
                <Button
                  id="accessLogin"
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  onClick={handleGoOffline}
                >
                  {'Auto setup and Go'}
                </Button>
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
