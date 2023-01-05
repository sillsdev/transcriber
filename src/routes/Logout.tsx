import { useState, useEffect, useContext, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as action from '../store';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { TokenContext } from '../context/TokenProvider';
import { isElectron } from '../api-variable';
import { localeDefault, useMyNavigate } from '../utils';
import { useGlobal } from '../mods/reactn';
import { GrowingSpacer } from '../control';
import { useLogoutResets } from '../utils/useLogoutResets';
const version = require('../../package.json').version;
const buildDate = require('../buildDate.json').date;

interface IDispatchProps {
  fetchLocalization: typeof action.fetchLocalization;
  setLanguage: typeof action.setLanguage;
}

interface IProps {}

export function Logout(props: IProps & IDispatchProps) {
  const { logout } = useAuth0();
  const { pathname } = useLocation();
  const navigate = useMyNavigate();
  const curPath = useRef('');
  const { fetchLocalization, setLanguage } = props;
  const [user] = useGlobal('user');
  const [isDeveloper] = useGlobal('developer');
  const [offlineOnly, setOfflineOnly] = useGlobal('offlineOnly');
  const ctx = useContext(TokenContext).state;
  const [view, setView] = useState('');
  const logoutResets = useLogoutResets();

  const handleLogout = async () => {
    const wasOfflineOnly = offlineOnly;
    if (offlineOnly) setOfflineOnly(false);
    await logoutResets();
    if (isElectron) {
      ctx.logout();
    } else {
      logout({ returnTo: window.origin });
    }
    setView(wasOfflineOnly ? 'offline' : 'online');
  };

  useEffect(() => {
    curPath.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    setLanguage(localeDefault(isDeveloper));
    fetchLocalization();
    if (!isElectron) {
      // ctx.logout();
      if (user) {
        logout({ returnTo: window.origin });
      } else {
        timer = setTimeout(() => {
          console.log(`timer fired path=${curPath.current}`);
          if (curPath.current === '/logout') {
            logout({ returnTo: window.origin });
          }
        }, 4000);
      }
    } else handleLogout();
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  if (/online|offline/i.test(view)) navigate(`/access/${view}`);

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

const mapDispatchToProps = (dispatch: any) => ({
  ...bindActionCreators(
    {
      fetchLocalization: action.fetchLocalization,
      setLanguage: action.setLanguage,
    },
    dispatch
  ),
});

export default connect(null, mapDispatchToProps)(Logout as any) as any as (
  props: IProps
) => JSX.Element;
