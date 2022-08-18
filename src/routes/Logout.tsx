import { useState, useEffect, useContext } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as action from '../store';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { TokenContext } from '../context/TokenProvider';
import { isElectron } from '../api-variable';
import { Redirect } from 'react-router-dom';
import { localeDefault } from '../utils';
import { useGlobal } from 'reactn';
import { LogLevel } from '@orbit/coordinator';
import { GrowingSpacer } from '../control';
const version = require('../../package.json').version;
const buildDate = require('../buildDate.json').date;

interface IDispatchProps {
  fetchLocalization: typeof action.fetchLocalization;
  setLanguage: typeof action.setLanguage;
}

interface IProps extends IDispatchProps {}

export function Logout(props: IProps) {
  const { logout } = useAuth0();
  const { fetchLocalization, setLanguage } = props;
  const [coordinator] = useGlobal('coordinator');
  const [user, setUser] = useGlobal('user');
  const [isDeveloper] = useGlobal('developer');
  const [, setIsOffline] = useGlobal('offline');
  const [offlineOnly, setOfflineOnly] = useGlobal('offlineOnly');
  const ctx = useContext(TokenContext).state;
  const [view, setView] = useState('');

  const handleLogout = async () => {
    const wasOfflineOnly = offlineOnly;
    if (offlineOnly) setOfflineOnly(false);
    setUser('');

    if (ctx.accessToken) {
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
      if (isElectron) {
        ctx.logout();
      } else {
        logout({ returnTo: window.origin });
      }
    }
    setView(wasOfflineOnly ? 'offline' : 'online');
  };

  useEffect(() => {
    setLanguage(localeDefault(isDeveloper));
    fetchLocalization();
    if (!isElectron) {
      // ctx.logout();
      if (user) {
        !isElectron && logout({ returnTo: window.origin });
      }
    } else handleLogout();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  if (/online|offline/i.test(view)) return <Redirect to={`/access/${view}`} />;

  return (
    <Box sx={{ width: '100%' }}>
      <AppBar
        position="static"
        color="inherit"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          boxShadow: 'none',
        }}
      >
        <Toolbar>
          <Typography variant="h6" color="inherit" sx={{ flexGrow: 1 }}>
            {process.env.REACT_APP_SITE_TITLE}
          </Typography>
        </Toolbar>
        <GrowingSpacer />
        <Box sx={{ alignSelf: 'center' }}>
          {version}
          <br />
          {buildDate}
        </Box>
      </AppBar>
    </Box>
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
