import React from 'react';
import { useGlobal } from 'reactn';
import { Redirect, useLocation } from 'react-router-dom';
import { useStickyRedirect } from '../../utils';
import { IState, IMainStrings } from '../../model';
import { connect } from 'react-redux';
import localStrings from '../../selector/localize';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  LinearProgress,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import Auth from '../../auth/Auth';
import { API_CONFIG, isElectron } from '../../api-variable';
import { UnsavedContext } from '../../context/UnsavedContext';
import HelpMenu from '../HelpMenu';
import UserMenu from '../UserMenu';
import { resetData, exitElectronApp, forceLogin } from '../../utils';
import { withBucket } from '../../hoc/withBucket';
import { usePlan } from '../../crud';
import Busy from '../Busy';

const ipc = isElectron ? require('electron').ipcRenderer : null;

const useStyles = makeStyles({
  appBar: {
    width: '100%',
    display: 'flex',
  },
  grow: {
    flexGrow: 1,
  },
  progress: {
    width: '100%',
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
}

export const AppHead = withBucket(
  connect(mapStateToProps)((props: IProps) => {
    const { auth, resetRequests, SwitchTo, t } = props;
    const classes = useStyles();
    const { pathname } = useLocation();
    const [isOffline] = useGlobal('offline');
    const [, setProject] = useGlobal('project');
    const [, setProjRole] = useGlobal('projRole');
    const [plan, setPlan] = useGlobal('plan');
    const ctx = React.useContext(UnsavedContext);
    const { checkSavedFn } = ctx.state;
    const [view, setView] = React.useState('');
    const { getPlanName } = usePlan();
    const [busy] = useGlobal('remoteBusy');
    const [importexportBusy] = useGlobal('importexportBusy');
    const [doSave] = useGlobal('doSave');
    const [globalStore] = useGlobal();
    const stickyPush = useStickyRedirect();

    const handleUserMenuAction = (
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
        checkSavedFn(() => {
          ipc?.invoke('logout');
          localStorage.removeItem('user-id');
          setView('Access');
        });
        return;
      }
      localStorage.setItem('fromUrl', lastpath);
      if (!/Close/i.test(what)) {
        if (/ClearLogout/i.test(what)) {
          forceLogin();
          setView('Logout');
        } else if (/Clear/i.test(what)) {
          if (resetRequests) resetRequests().then(() => setView(what));
        } else checkSavedFn(() => setView(what));
      }
    };

    const handleUserMenu = (what: string) => {
      handleUserMenuAction(what, pathname, setView, resetRequests);
    };

    const handleHome = () => {
      setProject('');
      setPlan('');
      setProjRole('');
      setView('Home');
    };

    // React.useEffect(() => {
    //   console.log(`pageview: ${pathname}`);
    // }, [pathname]);

    React.useEffect(() => {
      const handleUnload = (e: any) => {
        if (!globalStore.enableOffsite) {
          e.preventDefault();
          e.returnValue = '';
          return true;
        }
      };
      window.addEventListener('beforeunload', handleUnload);
      return () => {
        window.removeEventListener('beforeunload', handleUnload);
      };
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, []);

    if (view === 'Error') return <Redirect to="/error" />;
    if (view === 'Profile') stickyPush('/profile');
    if (view === 'Logout') return <Redirect to="/logout" />;
    if (view === 'Access') return <Redirect to="/" />;
    if (view === 'Home') stickyPush('/team');
    if (!auth || !auth.isAuthenticated(isOffline))
      return <Redirect to="/logout" />;

    return (
      <AppBar position="fixed" className={classes.appBar} color="inherit">
        <>
          <Toolbar>
            {plan !== '' && (
              <>
                <IconButton onClick={() => checkSavedFn(() => handleHome())}>
                  <HomeIcon />
                </IconButton>
                <Typography variant="h6" noWrap>
                  {getPlanName(plan)}
                </Typography>
              </>
            )}
            <div className={classes.grow}>{'\u00A0'}</div>
            <Typography variant="h6" noWrap>
              {pathname &&
                pathname.indexOf('team') < 0 &&
                `${
                  pathname && pathname.indexOf('work') > 0
                    ? t.transcribe
                    : t.admin
                } - `}
              {API_CONFIG.productName}
            </Typography>
            <div className={classes.grow}>{'\u00A0'}</div>
            {SwitchTo && <SwitchTo />}
            <HelpMenu online={!isOffline} />
            <UserMenu
              action={(what: string) => handleUserMenu(what)}
              auth={auth}
            />
          </Toolbar>
          {!importexportBusy || <Busy />}
          {(!busy && !doSave) || <LinearProgress variant="indeterminate" />}
        </>
      </AppBar>
    );
  })
);
