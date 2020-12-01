import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import fs from 'fs';
import { bindActionCreators } from 'redux';
import {
  IState,
  Project,
  GroupMembership,
  MediaFile,
  IAccessStrings,
} from '../model';
import localStrings from '../selector/localize';
import * as action from '../store';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { LogLevel } from '@orbit/coordinator';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Auth from '../auth/Auth';
import { isElectron } from '../api-variable';
import { Redirect } from 'react-router-dom';
import { dataPath, PathType, localeDefault } from '../utils';
import { useGlobal } from 'reactn';
import Alert from '../components/AlertDialog';
import ProjectExport from '../components/ProjectExport';
import {
  related,
  useProjectPlans,
  getMediaInPlans,
  useOfflnProjRead,
} from '../crud';
const version = require('../../package.json').version;
const buildDate = require('../buildDate.json').date;

const ipc = isElectron ? require('electron').ipcRenderer : null;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    grow: {
      flexGrow: 1,
    },
    appBar: theme.mixins.gutters({
      display: 'flex',
      flexDirection: 'row',
      boxShadow: 'none',
    }) as any,
    version: {
      alignSelf: 'center',
    },
  })
);

interface PlanProject {
  [planId: string]: string;
}

interface IStateProps {
  t: IAccessStrings;
}

interface IDispatchProps {
  fetchLocalization: typeof action.fetchLocalization;
  setLanguage: typeof action.setLanguage;
}

interface IRecordProps {
  groupMemberships: Array<GroupMembership>;
  projects: Array<Project>;
  mediafiles: Array<MediaFile>;
}

interface IProps extends IStateProps, IDispatchProps, IRecordProps {
  auth: Auth;
}

export function Logout(props: IProps) {
  const { auth, t } = props;
  const classes = useStyles();
  const { fetchLocalization, setLanguage } = props;
  const { groupMemberships, projects, mediafiles } = props;
  const [coordinator] = useGlobal('coordinator');
  const [isDeveloper] = useGlobal('developer');
  const [, setIsOffline] = useGlobal('offline');
  const [user] = useGlobal('user');
  const [view, setView] = React.useState('');
  const [alert, setAlert] = React.useState(false);
  const [downloadSize, setDownloadSize] = React.useState(0);
  const [needyIds, setNeedyIds] = React.useState<string[]>([]);
  const [expOpen, setExpOpen] = React.useState(false);
  const projectPlans = useProjectPlans();
  const offlineProject = useOfflnProjRead();

  const getNeedyRemoteIds = () => {
    const grpIds = groupMemberships
      .filter((gm) => related(gm, 'user') === user)
      .map((gm) => related(gm, 'group'));
    const userProjects = projects.filter((p) =>
      grpIds.includes(related(p, 'group'))
    );
    let planIds = Array<string>();
    const planProject: PlanProject = {};
    userProjects.forEach((p) => {
      const offlineProjRec = offlineProject(p.id);
      if (offlineProjRec?.attributes?.offlineAvailable) {
        projectPlans(p.id).forEach((pl) => {
          planIds.push(pl.id);
          planProject[pl.id] = p.id;
        });
      }
    });
    const mediaRecs = getMediaInPlans(planIds, mediafiles);
    const needyProject = new Set<string>();
    let totalSize = 0;
    mediaRecs.forEach((m) => {
      if (!fs.existsSync(dataPath(m.attributes.audioUrl, PathType.MEDIA))) {
        needyProject.add(planProject[related(m, 'plan')]);
        totalSize += m?.attributes?.filesize || 0;
      }
    });
    if (downloadSize !== totalSize) setDownloadSize(totalSize);
    return Array.from(needyProject);
  };

  const handleLogout = async () => {
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
        setView('Access');
      }
      auth.logout();
      ipc?.invoke('logout');
    }
    setView('Access');
  };

  const handleDownload = () => {
    setExpOpen(true);
  };

  useEffect(() => {
    setLanguage(localeDefault(isDeveloper));
    fetchLocalization();
    if (!isElectron) {
      auth.logout();
    } else if (auth.accessToken) {
      const projRemIds = getNeedyRemoteIds();
      if (projRemIds.length > 0) {
        setNeedyIds(projRemIds);
        setAlert(true);
      } else handleLogout();
    } else handleLogout();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  if (/Access/i.test(view)) return <Redirect to="/" />;
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
      {alert && (
        <Alert
          title={t.download}
          text={t.downloadMb.replace(
            '{0}',
            Math.ceil(downloadSize / 1000 + 0.5).toString()
          )}
          yesResponse={handleDownload}
          noResponse={handleLogout}
        />
      )}
      <ProjectExport
        open={expOpen}
        auth={auth}
        projectIds={needyIds}
        finish={handleLogout}
      />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'access' }),
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchLocalization: action.fetchLocalization,
      setLanguage: action.setLanguage,
    },
    dispatch
  ),
});

const mapRecordsToProps = {
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(Logout) as any
) as any;
