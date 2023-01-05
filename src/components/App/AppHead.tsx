import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useGlobal } from 'reactn';
import { useLocation, useParams } from 'react-router-dom';
import { IState, IMainStrings, IViewModeStrings } from '../../model';
import { connect, shallowEqual, useSelector } from 'react-redux';
import localStrings from '../../selector/localize';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  LinearProgress,
  Tooltip,
  Box,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdateAlt';
import TableViewIcon from '@mui/icons-material/TableView';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { API_CONFIG, isElectron } from '../../api-variable';
import { TokenContext } from '../../context/TokenProvider';
import { UnsavedContext } from '../../context/UnsavedContext';
import HelpMenu from '../HelpMenu';
import UserMenu from '../UserMenu';
import { GrowingSpacer } from '../../control';
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
  useMyNavigate,
} from '../../utils';
import { withBucket } from '../../hoc/withBucket';
import { usePlan, useLoadStatic } from '../../crud';
import Busy from '../Busy';
import StickyRedirect from '../StickyRedirect';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import ProjectDownloadAlert from '../ProjectDownloadAlert';
import { axiosPost } from '../../utils/axios';
import moment from 'moment';
import { useSnackBar, AlertSeverity } from '../../hoc/SnackBar';
import PolicyDialog from '../PolicyDialog';
import JSONAPISource from '@orbit/jsonapi';
import { viewModeSelector } from '../../selector';
import { useHome } from '../../utils/useHome';
const ipc = (window as any)?.electron;

const twoIcon = { minWidth: `calc(${48 * 2}px)` } as React.CSSProperties;
const threeIcon = { minWidth: `calc(${48 * 3}px)` } as React.CSSProperties;

interface INameProps {
  setView: React.Dispatch<React.SetStateAction<string>>;
  switchTo: boolean;
}

const ProjectName = ({ setView, switchTo }: INameProps) => {
  const ctx = useContext(UnsavedContext);
  const { checkSavedFn } = ctx.state;
  const { getPlanName } = usePlan();
  const [plan] = useGlobal('plan');
  const { prjId } = useParams();
  const navigate = useMyNavigate();
  const { goHome } = useHome();
  const t: IViewModeStrings = useSelector(viewModeSelector, shallowEqual);

  const handleHome = () => {
    goHome();
  };

  const handleAudioProject = () => {
    navigate(`/plan/${prjId}/0`);
  };

  const checkSavedAndGoAP = () => checkSavedFn(() => handleAudioProject());
  const checkSavedAndGoHome = () => checkSavedFn(() => handleHome());

  return (
    <>
      <Tooltip title={t.home}>
        <IconButton id="home" onClick={checkSavedAndGoHome}>
          <HomeIcon />
        </IconButton>
      </Tooltip>
      {plan && switchTo && (
        <Tooltip title={t.audioProject}>
          <IconButton id="project" onClick={checkSavedAndGoAP}>
            <TableViewIcon />
          </IconButton>
        </Tooltip>
      )}
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
  resetRequests: () => Promise<void>;
  switchTo: boolean;
}

export const AppHead = (props: IProps) => {
  const { resetRequests, switchTo, t, orbitStatus, orbitErrorMsg } = props;
  const { pathname } = useLocation();
  const navigate = useMyNavigate();
  const [home] = useGlobal('home');
  const [orgRole] = useGlobal('orgRole');
  const [errorReporter] = useGlobal('errorReporter');
  const [coordinator] = useGlobal('coordinator');
  const [user] = useGlobal('user');
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const [isOffline] = useGlobal('offline');
  const [connected] = useGlobal('connected');
  const tokenCtx = useContext(TokenContext);
  const ctx = useContext(UnsavedContext);
  const { checkSavedFn, startSave, toolsChanged, anySaving } = ctx.state;
  const [cssVars, setCssVars] = useState<React.CSSProperties>(twoIcon);
  const [view, setView] = useState('');
  const [busy] = useGlobal('remoteBusy');
  const [dataChangeCount] = useGlobal('dataChangeCount');
  const [importexportBusy] = useGlobal('importexportBusy');
  const [globalStore] = useGlobal();
  const [isChanged] = useGlobal('changed');
  const [lang] = useGlobal('lang');
  const [exitAlert, setExitAlert] = useState(false);
  const isMounted = useMounted('apphead');
  const [version, setVersion] = useState('');
  const [updates] = useState(
    (localStorage.getItem('updates') || 'true') === 'true'
  );
  const [latestVersion, setLatestVersion] = useGlobal('latestVersion');
  const [latestRelease, setLatestRelease] = useGlobal('releaseDate');
  const [complete] = useGlobal('progress');
  const [downloadAlert, setDownloadAlert] = useState(false);
  const [updateTipOpen, setUpdateTipOpen] = useState(false);
  const [showTerms, setShowTerms] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saving = useMemo(() => anySaving(), [toolsChanged]);
  const { showMessage } = useSnackBar();
  const { loadStatic, checkStaticTables } = useLoadStatic();
  const tv: IViewModeStrings = useSelector(viewModeSelector, shallowEqual);

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
    if (/ReloadStatic/.test(what)) {
      loadStatic();
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
    if (!lastpath.endsWith('null'))
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
    if (tokenCtx.state.expiresAt === -1) {
      handleUserMenu('Logout');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenCtx.state]);

  const downDone = () => {
    setDownloadAlert(false);
    if (localStorage.getItem('user-id')) exitApp();
    else setView('Logout');
  };

  const handleDownloadClick = (event: React.MouseEvent<HTMLElement>) => {
    if (ipc)
      ipc?.openExternal(
        'https://software.sil.org/audioprojectmanager/download/'
      );
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
    if (!user) {
      //are we here from a deeplink?
      if (
        pathname !== '/' &&
        !pathname.startsWith('/access') &&
        pathname !== '/loading'
      ) {
        console.log('pathname', pathname);
        setView('Access');
      }
    }
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
      } else startSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitAlert, isChanged]);

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
          if (isElectron && lv.split(' ')[0] !== version)
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
    if (remote && latestVersion) checkStaticTables(latestVersion);
    setCssVars(
      latestVersion !== '' && latestVersion !== version && isElectron
        ? threeIcon
        : twoIcon
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote, latestVersion]);

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

  if (view === 'Error') navigate('/error');
  if (view === 'Profile') return <StickyRedirect to="/profile" />;
  if (view === 'Logout') navigate('/logout');
  if (view === 'Access') navigate('/');
  if (view === 'Terms') navigate('/terms');
  if (view === 'Privacy') navigate('/privacy');
  return (
    <AppBar
      position="fixed"
      sx={{ width: '100%', display: 'flex' }}
      color="inherit"
    >
      <>
        {complete === 0 || complete === 100 || (
          <Box sx={{ width: '100%' }}>
            <LinearProgress id="prog" variant="determinate" value={complete} />
          </Box>
        )}
        {(!busy && !saving && !dataChangeCount) || complete !== 0 || (
          <LinearProgress id="busy" variant="indeterminate" />
        )}
        <Toolbar>
          {!home && orgRole && (
            <>
              <ProjectName setView={setView} switchTo={switchTo} />
              <GrowingSpacer />
              <Typography variant="h6">
                {switchTo ? tv.work : tv.audioProject}
              </Typography>
              <GrowingSpacer />
            </>
          )}
          {home && <span style={cssVars}>{'\u00A0'}</span>}
          <GrowingSpacer />
          {(pathname === '/' || pathname.startsWith('/access')) && (
            <>
              <Typography variant="h6" noWrap>
                {API_CONFIG.productName}
              </Typography>
              <GrowingSpacer />
            </>
          )}
          {'\u00A0'}
          {(isOffline || orbitStatus !== undefined || !connected) && (
            <CloudOffIcon sx={{ p: '12pt' }} color="action" />
          )}
          {latestVersion !== '' &&
            isElectron &&
            latestVersion.split(' ')[0] !== version && (
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
          {latestVersion !== '' &&
            !isElectron &&
            latestVersion.split(' ')[0] !== version &&
            latestVersion.split(' ').length > 1 && (
              <Tooltip
                arrow
                open={updateTipOpen}
                onOpen={handleUpdateOpen}
                onClose={handleUpdateClose}
                title={t.updateAvailable
                  .replace('{0}', latestVersion)
                  .replace('{1}', latestRelease)}
              >
                <IconButton
                  id="systemUpdate"
                  href="https://www.audioprojectmanager.org"
                >
                  <ExitToAppIcon color="primary" />
                </IconButton>
              </Tooltip>
            )}
          <HelpMenu online={!isOffline} />
          {pathname !== '/' && !pathname.startsWith('/access') && (
            <UserMenu action={handleUserMenu} />
          )}
        </Toolbar>
        {!importexportBusy || <Busy />}
        {downloadAlert && <ProjectDownloadAlert cb={downDone} />}
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
