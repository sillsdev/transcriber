import React from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { AppBar, Toolbar, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core';
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
  resetRequests: () => void;
  history: {
    action: string;
    location: {
      hash: string;
      pathname: string;
    };
  };
}

export const AppHead = withBucket((props: IProps) => {
  const { auth, history, resetRequests } = props;
  const classes = useStyles();
  const [isOffline] = useGlobal('offline');
  const [view, setView] = React.useState('');

  const handleUserMenuAction = (what: string) => {
    if (isElectron && /ClearLogout/i.test(what)) {
      resetData();
      exitElectronApp();
    }
    if (isElectron && /logout/i.test(what)) {
      localStorage.removeItem('user-id');
      setView('Access');
      return;
    }
    localStorage.setItem('url', history.location.pathname);
    if (!/Close/i.test(what)) {
      if (/ClearLogout/i.test(what)) {
        forceLogin();
        what = 'Logout';
      }
      if (/Clear/i.test(what)) {
        if (resetRequests) resetRequests();
        else console.log('ResetRequests not set in props');
      }
      setView(what);
    }
  };

  if (view === 'Error') return <Redirect to="/error" />;
  if (view === 'Profile') return <Redirect to="/profile" />;
  if (view === 'Logout') return <Redirect to="/logout" />;

  return (
    <AppBar position="fixed" className={classes.appBar} color="inherit">
      <Toolbar>
        <Typography variant="h6" noWrap>
          {t.silTranscriber}
        </Typography>
        <div className={classes.grow}>{'\u00A0'}</div>
        <HelpMenu online={!isOffline} />
        <UserMenu action={handleUserMenuAction} auth={auth} />
      </Toolbar>
    </AppBar>
  );
});
