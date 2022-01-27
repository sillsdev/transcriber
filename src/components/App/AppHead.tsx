import React, { useEffect, useState } from 'react';
import { useGlobal } from 'reactn';
import clsx from 'clsx';
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
  Tooltip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import SystemUpdateIcon from '@material-ui/icons/SystemUpdateAlt';
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
  waitForIt,
  logError,
  Severity,
  infoMsg,
  exitApp,
} from '../../utils';
import { withBucket } from '../../hoc/withBucket';
import { usePlan } from '../../crud';
import Busy from '../Busy';
import StickyRedirect from '../StickyRedirect';
import CloudOffIcon from '@material-ui/icons/CloudOff';
import ProjectDownloadAlert from '../ProjectDownloadAlert';
import { axiosPost } from '../../utils/axios';
import moment from 'moment';
import { useSnackBar, AlertSeverity } from '../../hoc/SnackBar';
import PolicyDialog from '../PolicyDialog';

const shell = isElectron ? require('electron').shell : null;

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
  spacing: {
    padding: '12px',
  },
  twoIcon: {
    minWidth: `calc(${48 * 2}px)`,
  },
  threeIcon: {
    minWidth: `calc(${48 * 3}px)`,
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
  const [, setProjType] = useGlobal('projType');
  const [plan, setPlan] = useGlobal('plan');

  const handleHome = () => {
    setProject('');
    setPlan('');
    setProjRole(undefined);
    setProjType('');
    setView('Home');
  };

  const checkSavedAndGoHome = () => checkSavedFn(() => handleHome());

  return (
    <>
      <IconButton id="home" onClick={checkSavedAndGoHome}>
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
  orbitStatus: number | undefined;
  orbitErrorMsg: string;
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
  orbitStatus: state.orbit.status,
  orbitErrorMsg: state.orbit.message,
});

interface IProps extends IStateProps {
  auth: Auth;
  resetRequests: () => Promise<void>;
  SwitchTo?: React.FC;
}

export const AppHead = (props: IProps) => {
  const { auth, resetRequests, SwitchTo, t, orbitStatus, orbitErrorMsg } =
    props;
  const classes = useStyles();
  const { pathname } = useLocation();
  const [errorReporter] = useGlobal('errorReporter');
  const [coordinator] = useGlobal('coordinator');
  const [isOffline] = useGlobal('offline');
  const [projRole] = useGlobal('projRole');
  const [connected] = useGlobal('connected');
  const ctx = React.useContext(UnsavedContext);
  const { checkSavedFn } = ctx.state;
  const [view, setView] = useState('');
  const [busy] = useGlobal('remoteBusy');
  const [dataChangeCount] = useGlobal('dataChangeCount');
  const [importexportBusy] = useGlobal('importexportBusy');
  const [globalStore] = useGlobal();
  const [isChanged] = useGlobal('changed');
  const [lang] = useGlobal('lang');
  const [exitAlert, setExitAlert] = React.useState(false);
  const [doSave, setDoSave] = useGlobal('doSave');
  const isMounted = useMounted('apphead');
  const [version, setVersion] = useState('');
  const [updates] = useState(
    (localStorage.getItem('updates') || 'true') === 'true'
  );
  const [latestVersion, setLatestVersion] = useGlobal('latestVersion');
  const [latestRelease, setLatestRelease] = useGlobal('releaseDate');
  const [complete] = useGlobal('progress');
  const [downloadAlert, setDownloadAlert] = React.useState(false);
  const [updateTipOpen, setUpdateTipOpen] = useState(false);
  const [showTerms, setShowTerms] = useState('');
  const { showMessage } = useSnackBar();

  const handleUserMenuAction = (
    what: string,
    lastpath: string,
    setView: (v: string) => void,
    resetRequests: () => Promise<void>
  ) => {
    if (/terms|privacy/i.test(what)) {
      setShowTerms(what);
      return;
    }
    if (isElectron && /ClearLogout/i.test(what)) {
      resetData();
      exitElectronApp();
    }
    const remote = coordinator.getSource('remote');
    if (isElectron && /Logout/i.test(what)) {
      localStorage.removeItem('user-id');
      checkSavedFn(async () => {
        waitForIt(
          'logout on electron...',
          () => !remote || !connected || remote.requestQueue.length === 0,
          () => false,
          200
        ).then(() => setDownloadAlert(true));
      });
      return;
    }
    localStorage.setItem(localUserKey(LocalKey.url), lastpath);
    if (!/Close/i.test(what)) {
      if (/ClearLogout/i.test(what)) {
        forceLogin();
        setView('Logout');
      } else if (/Clear/i.test(what)) {
        if (resetRequests) resetRequests().then(() => setView(what));
      } else if (/Logout/i.test(what)) {
        checkSavedFn(() => {
          waitForIt(
            'logout on web...',
            () => !remote || !connected || remote.requestQueue.length === 0,
            () => false,
            200
          ).then(() => setView('Logout'));
        });
      } else checkSavedFn(() => setView(what));
    }
  };

  const handleUserMenu = (what: string) => {
    handleUserMenuAction(what, pathname, setView, resetRequests);
  };

  useEffect(() => {
    if (auth.expiresAt === -1) {
      handleUserMenu('Logout');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.expiresAt]);

  const downDone = () => {
    setDownloadAlert(false);
    if (localStorage.getItem('user-id')) exitApp();
    else setView('Logout');
  };

  const handleDownloadClick = (event: React.MouseEvent<HTMLElement>) => {
    if (shell)
      shell.openExternal('https://software.sil.org/siltranscriber/download/');
    // remote?.getCurrentWindow().close();
  };

  useEffect(() => {
    const handleUnload = (e: any) => {
      if (pathname === '/') return true;
      if (pathname.startsWith('/access')) return true;
      if (!exitAlert && isElectron && isMounted()) setExitAlert(true);
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
        if (isMounted()) {
          setDownloadAlert(true);
        }
      } else if (!doSave) setDoSave(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitAlert, isChanged, doSave]);

  useEffect(() => {
    isMounted() && setVersion(require('../../../package.json').version);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  useEffect(() => {
    if (latestVersion === '' && version !== '' && updates) {
      var bodyFormData = new FormData();
      bodyFormData.append('env', navigator.userAgent);
      axiosPost('userversions/2/' + version, bodyFormData)
        .then((response) => {
          var lv = response?.data['desktopVersion'];
          var lr = response?.data['dateUpdated'];
          if (!lr.endsWith('Z')) lr += 'Z';
          lr = moment(lr).locale(lang).format('L');
          setLatestVersion(lv);
          setLatestRelease(lr);
          if (isElectron && lv !== version)
            showMessage(
              <span>
                {t.updateAvailable.replace('{0}', lv).replace('{1}', lr)}
                <IconButton
                  id="systemUpdate"
                  onClick={handleDownloadClick}
                  component="span"
                >
                  <SystemUpdateIcon color="primary" />
                </IconButton>
              </span>,
              AlertSeverity.Warning
            );
        })
        .catch((err) => {
          logError(
            Severity.error,
            errorReporter,
            infoMsg(err, 'userversions failed ' + navigator.userAgent)
          );
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updates, version, lang]);

  useEffect(() => {
    logError(Severity.info, errorReporter, pathname);
    setUpdateTipOpen(pathname === '/');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (orbitStatus) {
      showMessage(orbitErrorMsg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orbitStatus, orbitErrorMsg]);

  const handleUpdateOpen = () => setUpdateTipOpen(true);
  const handleUpdateClose = () => setUpdateTipOpen(pathname === '/');
  const handleTermsClose = () => setShowTerms('');

  if (view === 'Error') return <Redirect to="/error" />;
  if (view === 'Profile') return <StickyRedirect to="/profile" />;
  if (view === 'Logout') return <Redirect to="/logout" />;
  if (view === 'Access') return <Redirect to="/" />;
  if (view === 'Home') return <StickyRedirect to="/team" />;
  if (view === 'Terms') return <Redirect to="/terms" />;
  if (view === 'Privacy') return <Redirect to="/privacy" />;
  return (
    <AppBar position="fixed" className={classes.appBar} color="inherit">
      <>
        {complete === 0 || complete === 100 || (
          <div className={classes.progress}>
            <LinearProgress id="prog" variant="determinate" value={complete} />
          </div>
        )}
        {(!busy && !doSave && !dataChangeCount) || complete !== 0 || (
          <LinearProgress id="busy" variant="indeterminate" />
        )}
        <Toolbar>
          {projRole && <ProjectName setView={setView} />}
          {!projRole && (
            <span
              className={clsx(classes.twoIcon, {
                [classes.threeIcon]:
                  latestVersion !== '' &&
                  latestVersion !== version &&
                  isElectron,
              })}
            >
              {'\u00A0'}
            </span>
          )}
          <div className={classes.grow}>{'\u00A0'}</div>
          {(pathname === '/' || pathname.startsWith('/access')) && (
            <>
              <Typography variant="h6" noWrap>
                {API_CONFIG.productName}
              </Typography>
              <div className={classes.grow}>{'\u00A0'}</div>
            </>
          )}
          {SwitchTo && <SwitchTo />}
          {'\u00A0'}
          {(isOffline || orbitStatus !== undefined || !connected) && (
            <CloudOffIcon className={classes.spacing} color="action" />
          )}
          {latestVersion !== '' && latestVersion !== version && isElectron && (
            <Tooltip
              arrow
              open={updateTipOpen}
              onOpen={handleUpdateOpen}
              onClose={handleUpdateClose}
              title={t.updateAvailable
                .replace('{0}', latestVersion)
                .replace('{1}', latestRelease)}
            >
              <IconButton id="systemUpdate" onClick={handleDownloadClick}>
                <SystemUpdateIcon color="primary" />
              </IconButton>
            </Tooltip>
          )}
          <HelpMenu online={!isOffline} />
          {pathname !== '/' && !pathname.startsWith('/access') && (
            <UserMenu action={handleUserMenu} auth={auth} />
          )}
        </Toolbar>
        {!importexportBusy || <Busy />}
        {downloadAlert && <ProjectDownloadAlert auth={auth} cb={downDone} />}
        <PolicyDialog
          isOpen={Boolean(showTerms)}
          content={showTerms}
          onClose={handleTermsClose}
        />
      </>
    </AppBar>
  );
};

export default withBucket(connect(mapStateToProps)(AppHead));
