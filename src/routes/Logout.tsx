import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as action from '../store';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Auth from '../auth/Auth';
import { isElectron } from '../api-variable';
import { Redirect } from 'react-router-dom';
import { localeDefault } from '../utils';
import { useGlobal } from 'reactn';
import { LogLevel } from '@orbit/coordinator';
const version = require('../../package.json').version;
const buildDate = require('../buildDate.json').date;

const useStyles = makeStyles({
  root: {
    width: '100%',
  },
  grow: {
    flexGrow: 1,
  },
  appBar: {
    display: 'flex',
    flexDirection: 'row',
    boxShadow: 'none',
  },
  version: {
    alignSelf: 'center',
  },
});

interface IDispatchProps {
  fetchLocalization: typeof action.fetchLocalization;
  setLanguage: typeof action.setLanguage;
}

interface IProps extends IDispatchProps {
  auth: Auth;
}

export function Logout(props: IProps) {
  const { auth } = props;
  const { logout } = useAuth0();
  const classes = useStyles();
  const { fetchLocalization, setLanguage } = props;
  const [coordinator] = useGlobal('coordinator');
  const [, setUser] = useGlobal('user');
  const [isDeveloper] = useGlobal('developer');
  const [, setIsOffline] = useGlobal('offline');
  const [offlineOnly, setOfflineOnly] = useGlobal('offlineOnly');
  const [view, setView] = React.useState('');

  const handleLogout = async () => {
    const wasOfflineOnly = offlineOnly;
    if (offlineOnly) setOfflineOnly(false);
    setUser('');

    if (auth.accessToken) {
      localStorage.removeItem('isLoggedIn');
      setIsOffline(isElectron);
      if (isElectron && coordinator?.sourceNames.includes('remote')) {
        await coordinator.deactivate();
        coordinator.removeStrategy('remote-push-fail');
        coordinator.removeStrategy('remote-pull-fail');
        coordinator.removeStrategy('remote-request');
        coordinator.removeStrategy('remote-update');
        coordinator.removeStrategy('remote-sync');
        coordinator.removeSource('remote');
        await coordinator.activate({ logLevel: LogLevel.Warnings });
      }
      auth.logout();
      !isElectron && logout();
    }
    setView(wasOfflineOnly ? 'offline' : 'online');
  };

  useEffect(() => {
    setLanguage(localeDefault(isDeveloper));
    fetchLocalization();
    if (!isElectron) {
      auth.logout();
      !isElectron && logout();
    } else handleLogout();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  if (/online|offline/i.test(view)) return <Redirect to={`/access/${view}`} />;

  return (
    <div className={classes.root}>
      <AppBar className={classes.appBar} position="static" color="inherit">
        <Toolbar>
          <Typography variant="h6" color="inherit" className={classes.grow}>
            {process.env.REACT_APP_SITE_TITLE}
          </Typography>
        </Toolbar>
        <div className={classes.grow}>{'\u00A0'}</div>
        <div className={classes.version}>
          {version}
          <br />
          {buildDate}
        </div>
      </AppBar>
    </div>
  );
}

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchLocalization: action.fetchLocalization,
      setLanguage: action.setLanguage,
    },
    dispatch
  ),
});

export default connect(null, mapDispatchToProps)(Logout) as any;
