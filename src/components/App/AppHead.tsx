import React from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import Auth from '../../auth/Auth';
import { isElectron } from '../../api-variable';
import HelpMenu from '../HelpMenu';
import UserMenu from '../UserMenu';
import { resetData, exitElectronApp, forceLogin } from '../../utils';
import { withBucket } from '../../hoc/withBucket';

const useStyles = makeStyles({
  appBar: {
    width: '100%',
    display: 'flex',
  },
  grow: {
    flexGrow: 1,
  },
});

const t = {
  silTranscriber: 'SIL Transcriber',
};

interface IProps {
  auth: Auth;
  resetRequests: () => Promise<void>;
  SwitchTo?: React.FC;
  history: {
    action: string;
    location: {
      hash: string;
      pathname: string;
    };
  };
}

//exported only for drawer -- put back inside AppHead when drawer goes away
export const handleUserMenuAction = (
  what: string,
  lastpath: string,
  setView: (v: string) => void,
  resetRequests: () => Promise<void>
) => {
  if (isElectron && /ClearLogout/i.test(what)) {
    resetData();
    exitElectronApp();
  }
  if (isElectron && /logout/i.test(what)) {
    localStorage.removeItem('user-id');
    setView('Access');
    return;
  }
  localStorage.setItem('url', lastpath);
  if (!/Close/i.test(what)) {
    if (/ClearLogout/i.test(what)) {
      forceLogin();
      what = 'Logout';
    }
    if (/Clear/i.test(what)) {
      if (resetRequests) resetRequests().then(() => setView(what));
      else console.log('ResetRequests not set in props');
    } else setView(what);
  }
};

export const AppHead = withBucket((props: IProps) => {
  const { auth, history, resetRequests, SwitchTo } = props;
  const classes = useStyles();
  const [isOffline] = useGlobal('offline');
  const [isDeveloper] = useGlobal('developer');
  const [project, setProject] = useGlobal('project');
  const [view, setView] = React.useState('');

  const handleUserMenu = (what: string) => {
    handleUserMenuAction(
      what,
      history.location.pathname,
      setView,
      resetRequests
    );
  };

  const handleHome = () => {
    setProject('');
  };

  if (view === 'Error') return <Redirect to="/error" />;
  if (view === 'Profile') return <Redirect to="/profile" />;
  if (view === 'Logout') return <Redirect to="/logout" />;

  return (
    <AppBar position="fixed" className={classes.appBar} color="inherit">
      {isDeveloper && project !== '' ? (
        <Toolbar>
          <IconButton onClick={handleHome}>
            <HomeIcon />
          </IconButton>
          <div className={classes.grow}>{'\u00A0'}</div>
          <Typography variant="h6" noWrap>
            {t.silTranscriber}
          </Typography>
          <div className={classes.grow}>{'\u00A0'}</div>
          {SwitchTo && <SwitchTo />}
          <HelpMenu online={!isOffline} />
          <UserMenu action={handleUserMenu} auth={auth} />
        </Toolbar>
      ) : (
        <Toolbar>
          <Typography variant="h6" noWrap>
            {t.silTranscriber}
          </Typography>
          <div className={classes.grow}>{'\u00A0'}</div>
          <HelpMenu online={!isOffline} />
          <UserMenu action={handleUserMenu} auth={auth} />
        </Toolbar>
      )}
    </AppBar>
  );
});
