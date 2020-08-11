import React from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { IState, IMainStrings } from '../../model';
import { connect } from 'react-redux';
import localStrings from '../../selector/localize';
import { AppBar, Toolbar, Typography, IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import Auth from '../../auth/Auth';
import { isElectron } from '../../api-variable';
import HelpMenu from '../HelpMenu';
import UserMenu from '../UserMenu';
import { resetData, exitElectronApp, forceLogin } from '../../utils';
import { withBucket } from '../../hoc/withBucket';
import { usePlanName } from '../../crud';

const ipc = isElectron ? require('electron').ipcRenderer : null;

const useStyles = makeStyles({
  appBar: {
    width: '100%',
    display: 'flex',
  },
  grow: {
    flexGrow: 1,
  },
});

interface IStateProps {
  t: IMainStrings;
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
});

interface IProps extends IStateProps {
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
    ipc?.invoke('logout');
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

export const AppHead = withBucket(
  connect(mapStateToProps)((props: IProps) => {
    const { auth, history, resetRequests, SwitchTo, t } = props;
    const classes = useStyles();
    const [isOffline] = useGlobal('offline');
    const [isDeveloper] = useGlobal('developer');
    const [, setProject] = useGlobal('project');
    const [plan, setPlan] = useGlobal('plan');
    const [view, setView] = React.useState('');
    const planName = usePlanName();

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
      setPlan('');
    };

    if (view === 'Error') return <Redirect to="/error" />;
    if (view === 'Profile') return <Redirect to="/profile" />;
    if (view === 'Logout') return <Redirect to="/logout" />;

    return (
      <AppBar position="fixed" className={classes.appBar} color="inherit">
        {isDeveloper && plan !== '' ? (
          <Toolbar>
            <IconButton onClick={handleHome}>
              <HomeIcon />
            </IconButton>
            <Typography variant="h6" noWrap>
              {planName(plan)}
            </Typography>
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
  })
);
