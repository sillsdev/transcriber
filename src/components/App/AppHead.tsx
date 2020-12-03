import React, { useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect, useLocation } from 'react-router-dom';
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
import {
  resetData,
  exitElectronApp,
  forceLogin,
  localUserKey,
  LocalKey,
  useMounted,
} from '../../utils';
import { withBucket } from '../../hoc/withBucket';
import { usePlan } from '../../crud';
import Busy from '../Busy';
import StickyRedirect from '../StickyRedirect';
import CloudOffIcon from '@material-ui/icons/CloudOff';

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

interface INameProps {
  setView: React.Dispatch<React.SetStateAction<string>>;
}

const ProjectName = ({ setView }: INameProps) => {
  const ctx = React.useContext(UnsavedContext);
  const { checkSavedFn } = ctx.state;
  const { getPlanName } = usePlan();
  const [, setProject] = useGlobal('project');
  const [, setProjRole] = useGlobal('projRole');
  const [plan, setPlan] = useGlobal('plan');

  const handleHome = () => {
    setProject('');
    setPlan('');
    setProjRole('');
    setView('Home');
  };

  const checkSavedAndGoHome = () => checkSavedFn(() => handleHome());

  return (
    <>
      <IconButton onClick={checkSavedAndGoHome}>
        <HomeIcon />
      </IconButton>
      <Typography variant="h6" noWrap>
        {getPlanName(plan)}
      </Typography>
    </>
  );
};

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

export const AppHead = (props: IProps) => {
  const { auth, resetRequests, SwitchTo, t } = props;
  const classes = useStyles();
  const { pathname } = useLocation();
  const [memory] = useGlobal('memory');
  const [isOffline] = useGlobal('offline');
  const [projRole] = useGlobal('projRole');
  const ctx = React.useContext(UnsavedContext);
  const { checkSavedFn } = ctx.state;
  const [view, setView] = React.useState('');
  const [busy] = useGlobal('remoteBusy');
  const [importexportBusy] = useGlobal('importexportBusy');
  const [doSave] = useGlobal('doSave');
  const [globalStore] = useGlobal();
  const [isChanged] = useGlobal('changed');
  const [exitAlert, setExitAlert] = React.useState(false);
  const [dosave, setDoSave] = useGlobal('doSave');
  const isMounted = useMounted();
  const [pathDescription, setPathDescription] = React.useState('');

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
        setView('Logout');
      });
      return;
    }
    localStorage.setItem(localUserKey(LocalKey.url, memory), lastpath);
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

  React.useEffect(() => {
    const handleUnload = (e: any) => {
      if (!exitAlert && isElectron && isMounted.current) setExitAlert(true);
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

  useEffect(() => {
    if (exitAlert)
      if (!isChanged) {
        if (isMounted.current) setView('Logout');
      } else if (!dosave) setDoSave(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitAlert, isChanged, dosave]);

  useEffect(() => {
    const description =
      pathname &&
      pathname.indexOf('team') < 0 &&
      `${pathname && pathname.indexOf('work') > 0 ? t.transcribe : t.admin} - `;
    isMounted.current && setPathDescription(description || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, t.admin, t.transcribe, isMounted]);

  if (view === 'Error') return <Redirect to="/error" />;
  if (view === 'Profile') return <StickyRedirect to="/profile" />;
  if (view === 'Logout') return <Redirect to="/logout" />;
  if (view === 'Access') return <Redirect to="/" />;
  if (view === 'Home') return <StickyRedirect to="/team" />;

  return (
    <AppBar position="fixed" className={classes.appBar} color="inherit">
      <>
        <Toolbar>
          {projRole !== '' && <ProjectName setView={setView} />}
          <div className={classes.grow}>{'\u00A0'}</div>
          <Typography variant="h6" noWrap>
            {pathDescription}
            {API_CONFIG.productName}
          </Typography>
          <div className={classes.grow}>{'\u00A0'}</div>
          {isOffline && <CloudOffIcon />}
          {'\u00A0'}
          {SwitchTo && <SwitchTo />}
          <HelpMenu online={!isOffline} />
          <UserMenu action={handleUserMenu} auth={auth} />
        </Toolbar>
        {!importexportBusy || <Busy />}
        {(!busy && !doSave) || <LinearProgress variant="indeterminate" />}
      </>
    </AppBar>
  );
};

export default withBucket(connect(mapStateToProps)(AppHead));
