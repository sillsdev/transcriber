import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  IState,
  IMainStrings,
  Organization,
  Project,
  Plan,
  Group,
  OrganizationMembership,
  GroupMembership,
  Role,
  MediaFile,
} from '../model';
import * as actions from '../store';
import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder, Record } from '@orbit/data';
import {
  AppBar,
  Avatar,
  CssBaseline,
  Divider,
  Drawer,
  Hidden,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  LinearProgress,
  Button,
  Tooltip,
} from '@material-ui/core';
import {
  makeStyles,
  useTheme,
  Theme,
  createStyles,
} from '@material-ui/core/styles';
import OrganizationIcon from '@material-ui/icons/AccountBalance';
import GroupIcon from '@material-ui/icons/Group';
import SettingsIcon from '@material-ui/icons/SettingsTwoTone';
import TeamIcon from '@material-ui/icons/GroupWorkTwoTone';
import PlanIcon from '@material-ui/icons/WidgetsTwoTone';
import MediaIcon from '@material-ui/icons/AudiotrackTwoTone';
import IntegrationIcon from '@material-ui/icons/PowerTwoTone';
import DownloadIcon from '@material-ui/icons/CloudDownload';
import UploadIcon from '@material-ui/icons/CloudUpload';
import ReportIcon from '@material-ui/icons/Assessment';
import MenuIcon from '@material-ui/icons/Menu';
import AddIcon from '@material-ui/icons/Add';
import ListIcon from '@material-ui/icons/List';
import { withBucket } from '../hoc/withBucket';
import ReactSelect, { OptionType } from '../components/ReactSelect';
import Auth from '../auth/Auth';
import UserMenu from '../components/UserMenu';
import HelpMenu from '../components/HelpMenu';
import OrgSettings from '../components/OrgSettings';
import LazyLoad from '../hoc/LazyLoad';
import PlanTabs from '../components/PlanTabs';
import MediaTab from '../components/MediaTab';
import TranscriptionTab from '../components/TranscriptionTab';
import ImportTab from '../components/ImportTab';
import Team from '../components/GroupSettings/Team';
import GroupSettings from '../components/GroupSettings/GroupSettings';
import Confirm from '../components/AlertDialog';
import TaskTable from '../components/TaskTable';
import { TranscriberProvider } from '../context/TranscriberContext';
import Transcriber from '../components/Transcriber';
import IntegrationPanel from '../components/Integration';
import PlanTable from '../components/PlanTable';
import { IAddArgs } from '../components/ProjectSettings';
import Busy from '../components/Busy';
import Setup from '../components/Setup';
import NotSetup from '../components/NotSetup';
import SnackBar from '../components/SnackBar';
import {
  related,
  deepLink,
  remoteId,
  remoteIdGuid,
  makeAbbr,
  Online,
  remoteIdNum,
  forceLogin,
} from '../utils';
import logo from './transcriber10.png';
import { isElectron, API_CONFIG } from '../api-variable';
import { TaskItemWidth } from '../components/TaskTable';
import { dateChanges } from './dateChanges';
import { getOrgs } from '../utils/getOrgs';
import { DataPath } from '../utils/DataPath';
import { IAxiosStatus } from '../store/AxiosStatus';
import { LoadProjectData, AddProjectLoaded } from '../utils/loadData';

const noop = { openExternal: () => {} };
const { shell } = isElectron ? require('electron') : { shell: noop };

export const DrawerWidth = 240;
export const DrawerTask = 9;
export const DrawerMin = 7;
export const HeadHeight = 64;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    grow: {
      flexGrow: 1,
    },
    hide: {
      display: 'none',
    },
    drawer: {
      [theme.breakpoints.up('sm')]: {
        width: DrawerWidth,
        flexShrink: 0,
      },
    },
    drawerMini: {
      overflowX: 'hidden',
      width: theme.spacing(DrawerMin) + 1,
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(DrawerTask) + 1,
      },
    },
    header: {
      display: 'flex',
      flexDirection: 'row',
      paddingRight: theme.spacing(1.5),
    },
    appBar: {
      boxShadow: 'none',
      marginLeft: DrawerWidth,
      [theme.breakpoints.up('sm')]: {
        width: `calc(100% - ${DrawerWidth}px)`,
      },
    },
    appBarShift: {
      boxShadow: 'none',
      marginLeft: 0,
      left: theme.spacing(DrawerMin) + 1,
      width: `calc(100% - ${theme.spacing(DrawerMin)}px)`,
      [theme.breakpoints.up('sm')]: {
        left: theme.spacing(DrawerTask) + 1,
        width: `calc(100% - ${theme.spacing(DrawerTask)}px)`,
      },
    },
    menuButton: {
      marginRight: theme.spacing(2),
      [theme.breakpoints.up('sm')]: {
        display: 'none',
      },
    },
    toolbar: theme.mixins.toolbar as any,
    drawerPaper: {
      width: DrawerWidth,
    },
    appName: {
      lineHeight: 0,
    },
    content: {
      flexGrow: 1,
      paddingTop: `${HeadHeight}px`,
    },
    organization: {
      display: 'flex',
      height: '64px',
    },
    project: {
      height: '100px',
      marginTop: '10px',
      marginRight: '10px',
      marginLeft: '10px',
    },
    avatar: {
      paddingTop: '10px',
      paddingLeft: '10px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    },
    select: {
      height: '64px',
      padding: '10px',
      flexGrow: 1,
    },
    contained: {
      backgroundColor: theme.palette.grey[200],
      height: '64px',
    },
    logo: {
      paddingRight: theme.spacing(2),
      height: '48px',
      width: '64px',
    },
    panel2: {
      display: 'flex',
      flexDirection: 'row',
    },
    topFilter: {
      zIndex: 2,
      position: 'absolute',
      left: theme.spacing(DrawerMin) + 1,
      [theme.breakpoints.up('sm')]: {
        left: theme.spacing(DrawerTask) + 1,
      },
      backgroundColor: 'white',
    },
    topTranscriber: {
      zIndex: 1,
      position: 'absolute',
      left: theme.spacing(DrawerMin) + TaskItemWidth + theme.spacing(0.5),
      [theme.breakpoints.up('sm')]: {
        left: theme.spacing(DrawerTask) + TaskItemWidth + theme.spacing(0.5),
      },
    },
    progress: {
      top: `calc(${HeadHeight}px - ${theme.spacing(1)}px)`,
      zIndex: 100,
      width: '100%',
    },
    busy: {
      margin: 'auto',
    },
    navButton: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
  })
);

export enum NavChoice {
  UsersAndGroups = 'usersandgroups',
  Organization = 'organization',
  Tasks = 'tasks',
  Plans = 'plans',
  Team = 'team',
  Media = 'media',
  Reports = 'reports',
  Settings = 'settings',
  Export = 'export',
  Import = 'import',
  Integrations = 'integrations',
  Scripture = 'scripture-plan',
  General = 'other-plan',
  None = 'none',
  Setup = 'setup',
  NotSetup = 'notsetup',
}

interface componentType {
  [key: string]: JSX.Element | string;
}

interface IStateProps {
  t: IMainStrings;
  orbitLoaded: boolean;
  importStatus: IAxiosStatus | undefined;
}

interface IDispatchProps {
  resetOrbitError: typeof actions.resetOrbitError;
  orbitError: typeof actions.doOrbitError;
}

interface IRecordProps {
  organizationMemberships: Array<OrganizationMembership>;
  plans: Array<Plan>;
  groupMemberships: Array<GroupMembership>;
  roles: Array<Role>;
  mediafiles: Array<MediaFile>;
  projects: Array<Project>;
}

interface IProps extends IStateProps, IDispatchProps, IRecordProps {
  auth: Auth;
  resetRequests: () => void;
  history: {
    action: string;
    location: {
      hash: string;
      pathname: string;
    };
    push: (path: string) => void;
    replace: (path: string) => void;
  };
}

export function ResponsiveDrawer(props: IProps) {
  const {
    auth,
    resetRequests,
    t,
    history,
    plans,
    orbitLoaded,
    importStatus,
    organizationMemberships,
    groupMemberships,
    roles,
    mediafiles,
    projects,
    orbitError,
  } = props;
  const classes = useStyles();
  const theme = useTheme();
  const [keyMap] = useGlobal('keyMap');
  const [memory] = useGlobal('memory');
  const [remote] = useGlobal('remote');
  const [backup] = useGlobal('backup');
  const [schema] = useGlobal('schema');
  const [fingerprint] = useGlobal('fingerprint');
  const [projectsLoaded, setProjectsLoaded] = useGlobal('projectsLoaded');
  const [isApp, setAppView] = useGlobal('appView');
  const [user] = useGlobal('user');
  const [errorReporter] = useGlobal('errorReporter');
  const [busy, setBusy] = useGlobal('remoteBusy');
  const [importexportBusy] = useGlobal('importexportBusy');
  const [organization, setOrganization] = useGlobal('organization');
  const [offline] = useGlobal('offline'); // true if Electron
  const [online, setOnline] = useState(false); // true if Internet
  const [orgRole, setOrgRole] = useGlobal('orgRole');
  const [group, setGroup] = useGlobal('group');
  const [project, setProject] = useGlobal('project');
  const [projRole, setProjRole] = useGlobal('projRole');
  const [plan, setPlan] = useGlobal('plan');
  const [tab, setTab] = useGlobal('tab');
  const [changed, setChanged] = useGlobal('changed');
  const [doSave, setDoSave] = useGlobal('doSave');
  const [alertOpen, setAlertOpen] = useGlobal('alertOpen');
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [_autoOpenAddMedia, setAutoOpenAddMedia] = useGlobal(
    'autoOpenAddMedia'
  );
  const [choice, setChoice] = useState('');
  const [content, setContent] = useState('');
  const [orgOptions, setOrgOptions] = useState(Array<OptionType>());
  const [curOrg, setCurOrg] = useState<number | null>(null);
  const [orgAvatar, setOrgAvatar] = useState<string>('');
  const [projOptions, setProjOptions] = useState(Array<OptionType>());
  const [curProj, setCurProj] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mini, setMini] = useState(false);
  const [addProject, setAddProject] = useState(false);
  const [addOrg, setAddOrg] = useState(false);
  const [title, setTitle] = useState(t.silTranscriber);
  const [view, setView] = useState('');
  const [message, setMessage] = useState(<></>);
  const saveConfirm = useRef<() => any>();
  const [topFilter, setTopFilter] = useState(false);
  const [transcribe, setTranscribe] = useState(false);
  const timer = React.useRef<NodeJS.Timeout>();
  const syncTimer = React.useRef<NodeJS.Timeout>();

  const slugMap: { [key: string]: string } = {
    [NavChoice.UsersAndGroups]: t.usersAndGroups,
    [NavChoice.Organization]: t.organization,
    [NavChoice.Tasks]: t.tasks,
    [NavChoice.Plans]: t.plans,
    [NavChoice.Team]: t.team,
    [NavChoice.Media]: t.media,
    [NavChoice.Reports]: t.reports,
    [NavChoice.Settings]: t.settings,
    [NavChoice.Export]: t.export,
    [NavChoice.Import]: t.import,
    [NavChoice.Integrations]: t.integrations,
  };
  const frSlug = (slug: string) => {
    return slugMap[slug];
  };
  const toSlug = (choice: string) => {
    for (let i of Object.keys(slugMap)) {
      if (slugMap[i] === choice) return i;
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleChoice = (choice: string) => {
    localStorage.removeItem('url');
    setAddProject(false);
    let nextContent = choice;
    if (choice === NavChoice.Tasks && !transcribe) {
      nextContent = projRole === 'admin' ? NavChoice.Setup : NavChoice.NotSetup;
    }
    setChoice(choice);
    setContent(nextContent);
    setTitle(frSlug(choice));
    setPlan('');
    setMini(choice === NavChoice.Tasks);
    if (choice === NavChoice.UsersAndGroups) {
      if (tab > 1) {
        setTab(0);
      }
      setGroup('');
    }
  };

  const handleCommitOrg = (value: string) => {
    localStorage.removeItem('url');
    localStorage.setItem(
      'lastOrg',
      remoteId(NavChoice.Organization, value, keyMap)
    );
    if (value === t.newOrganization) {
      setAddOrg(true);
      setContent(NavChoice.Organization);
      setTitle(t.addOrganization);
    } else if (value !== organization) {
      setOrganization(value);
      setAddProject(false);
      setGroup('');
      setProjOptions([]);
      setCurProj(null);
      setTranscribe(false);
      setChoice('');
    }
  };

  const handleFinishOrgAdd = () => {
    setAddOrg(false);
    setProjRole('admin');
    setTimeout(() => handleAddProject(), 1000);
  };

  const defaultView = () => {
    let newChoice = NavChoice.Tasks;
    if (!isApp && projRole === 'admin') newChoice = NavChoice.Plans;
    if (projOptions.length === 0 || !transcribe) {
      newChoice = projRole === 'admin' ? NavChoice.Setup : NavChoice.NotSetup;
      if (!isElectron && projRole === 'admin' && isApp) setAppView(false);
    }
    if (newChoice === NavChoice.Tasks && !isApp) setAppView(true);
    if (newChoice !== content) {
      setContent(newChoice);
      setChoice(newChoice);
      setTitle(frSlug(newChoice));
      setMini(newChoice === NavChoice.Tasks);
    }
  };

  const handleCommitProj = (value: string) => {
    localStorage.removeItem('url');
    localStorage.setItem('lastProj', remoteId('project', value, keyMap));
    if (addProject) setAddProject(false); // for exiting from add project
    if (choice === '') {
      defaultView();
    }
    //on deep linking we will have already set the project
    if (value !== project) {
      setProject(value);
      setContent(choice); //bring us out of plan details if down there
      setTitle(frSlug(choice));
      setPlan('');
    }
    if (group !== '') setGroup('');
  };

  const handleMessageReset = () => setMessage(<></>);

  const handlePlanType = (value: string | null) => {
    localStorage.removeItem('url');
    if (!value || value.toLocaleLowerCase() === 'scripture') {
      setContent(NavChoice.Scripture);
    } else {
      setContent(NavChoice.General);
    }
  };

  const handleAddProject = () => {
    localStorage.removeItem('url');
    setAddProject(true);
    if (isApp) setAppView(false);
    setProject('');
    setPlan('');
    setContent(NavChoice.Settings);
    setTitle(t.addProject);
  };

  const handleFinishAdd = ({ to, projectId, planId }: IAddArgs) => {
    setProjOptions([]);
    if (projectId)
      AddProjectLoaded(projectId, projectsLoaded, setProjectsLoaded);
    if (to) {
      setAddProject(false);
      setProject(projectId || '');
      setPlan(planId || '');
      const parts = to.split('/');
      setContent(parts[3]);
      setChoice(NavChoice.Plans);
      if (mini) setMini(false);
      setTab(parseInt(parts[6]));
      setTimeout(() => {
        setAutoOpenAddMedia(true);
      }, 2000);
    } else {
      setContent(NavChoice.Plans);
      setChoice(NavChoice.Plans);
      setTitle(t.plans);
      if (mini) setMini(false);
      setPlan('');
      if (addProject) setAddProject(false);

      if (projectId) setProject(projectId);
    }
  };

  const handleUserMenuAction = (what: string) => {
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

  const handleSwitch = () => {
    checkSavedFn(() => setAppView(!isApp));
  };

  const handleAdmin = (where: string) => () => {
    checkSavedFn(() => shell.openExternal(where));
  };

  const checkSavedFn = (method: () => any) => {
    if (busy) {
      setMessage(<span>{t.loadingTable}</span>);
      return;
    }
    if (changed) {
      saveConfirm.current = method;
      setAlertOpen(true);
    } else {
      method();
    }
  };
  let clickVal = '';
  const choiceClick = (text: string) => () => {
    clickVal = toSlug(text) || NavChoice.None;
    checkSavedFn(() => handleChoice(clickVal));
  };
  const menuAction = (v: string) => {
    clickVal = v;
    if (/Clear/i.test(v)) handleUserMenuAction(v);
    else checkSavedFn(() => handleUserMenuAction(clickVal));
  };
  const commitOrg = (v: string, e: any, callback: () => void) => {
    clickVal = v;
    checkSavedFn(() => {
      handleCommitOrg(clickVal);
      callback();
    });
  };
  const commitProj = (v: string, e: any, callback: () => void) => {
    clickVal = v;
    checkSavedFn(() => {
      handleCommitProj(clickVal);
      callback();
    });
  };
  const handleSaveRefused = () => {
    if (saveConfirm.current) saveConfirm.current();
    saveConfirm.current = undefined;
    setAlertOpen(false);
    setChanged(false);
  };
  const finishConfirmed = (
    savedMethod: (() => any) | undefined,
    tryCount: number
  ) => {
    setTimeout(() => {
      if (remote.requestQueue.length === 0) {
        if (savedMethod) savedMethod();
      } else {
        if (tryCount > 0) finishConfirmed(savedMethod, tryCount - 1);
      }
    }, 2000);
  };
  const handleSaveConfirmed = () => {
    const savedMethod = saveConfirm.current;
    saveConfirm.current = undefined;
    setMessage(<span>{t.saving}</span>);
    setChanged(false);
    setDoSave(true);
    setAlertOpen(false);
    finishConfirmed(savedMethod, 8);
  };
  const getRole = (table: Record[], relate: string, id: string) => {
    const memberRecs = table.filter(
      (tbl) => related(tbl, 'user') === user && related(tbl, relate) === id
    );
    if (memberRecs.length === 1) {
      const roleId = related(memberRecs[0], 'role');
      const roleRecs = roles.filter((r) => r.id === roleId);
      if (roleRecs.length === 1) {
        const attr = roleRecs[0].attributes;
        if (attr && attr.roleName) return attr.roleName.toLocaleLowerCase();
      }
    }
    return '';
  };
  const handleTopFilter = (top: boolean) => setTopFilter(top);

  const getProjs = async () => {
    if (isElectron) {
      const groupids = groupMemberships
        .filter((gm) => related(gm, 'user') === user)
        .map((gm) => related(gm, 'group'));

      return projects.filter((p) => groupids.includes(related(p, 'group')));
    }
    return projects;
  };

  useEffect(() => {
    Online((val) => setOnline(val), auth);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    if (!doSave && saveConfirm.current) {
      saveConfirm.current();
      saveConfirm.current = undefined;
    }
  }, [doSave]);

  useEffect(() => {
    if (errorReporter && user && user !== '') {
      errorReporter.user = {
        id: remoteIdNum('user', user, keyMap),
        authId: localStorage.getItem('user-token'),
      };
    }
    if (orbitLoaded) {
      const organizations = getOrgs(memory, user);
      const orgOpts = organizations
        .filter((o) => o.attributes)
        .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1))
        .map((o: Organization) => {
          return {
            value: o.id,
            label: o.attributes.name,
          };
        });
      setOrgOptions(
        isApp
          ? orgOpts
          : orgOpts.concat({
              value: t.newOrganization,
              label: t.newOrganization + '    \uFF0B',
              // or \u2795
            })
      );

      const orgRec = organizations.filter((o) => o.id === organization);
      if (orgRec.length > 0) {
        const attr = orgRec[0].attributes;
        setOrgAvatar(attr?.logoUrl ? DataPath(attr.logoUrl) : '');
      }
      setOrgRole(
        getRole(organizationMemberships, 'organization', organization)
      );
    }

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [organization, user, organizationMemberships, orgRole, isApp]);

  useEffect(() => {
    if (orgOptions) {
      const orgKey =
        organization !== ''
          ? organization
          : remoteIdGuid(
              'organization',
              localStorage.getItem('lastOrg') || '',
              keyMap
            ) || '';
      const cur = orgOptions.map((oo) => oo.value).indexOf(orgKey);
      if (cur !== -1) setCurOrg(cur);
      else if (!busy && orgOptions.length > (isApp ? 0 : 1) && curOrg === null)
        handleCommitOrg(orgOptions[0].value);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [orgOptions, organization, isApp]);

  useEffect(() => {
    getProjs().then((projects) => {
      const projOpts = projects
        .filter(
          (p) => related(p, 'organization') === organization && p.attributes
        )
        .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1))
        .map((p) => {
          return {
            value: p.id,
            label: p.attributes.name,
          };
        });
      setProjOptions(projOpts);
      if (projOpts.length === 0) {
        setCurProj(null);
        if (
          content !== NavChoice.UsersAndGroups &&
          content !== NavChoice.Organization
        ) {
          if (!offline && orgRole === 'admin') {
            handleAddProject();
          }
        }
      }
    });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [organization, orgRole, user, projects]);

  useEffect(() => {
    const projKeys = projOptions.map((o) => o.value);
    const projKey =
      project !== ''
        ? project
        : remoteIdGuid(
            'project',
            localStorage.getItem('lastProj') || '',
            keyMap
          ) || '';
    const cur = projKeys.indexOf(projKey);

    if (addProject || cur === -1) {
      setCurProj(null);
    } else if (!busy && curProj !== cur) {
      setCurProj(cur);
      handleCommitProj(projKeys[cur]);
    }
    if (!busy && projKeys.length > 0 && !addProject && cur < 0) {
      setCurProj(0);
      handleCommitProj(projKeys[0]);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [projOptions, project, addProject, busy]);

  useEffect(() => {
    LoadProjectData(
      project,
      memory,
      remote,
      backup,
      projectsLoaded,
      setProjectsLoaded,
      orbitError
    );
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [project]);

  useEffect(() => {
    try {
      const projRec: Project = memory.cache.query((q: QueryBuilder) =>
        q.findRecord({ type: 'project', id: project })
      ) as any;
      const groupId = related(projRec, 'group');
      setProjRole(getRole(groupMemberships, 'group', groupId));
    } catch {} // Ignore if project not found
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [project, addProject, curProj, user]);

  useEffect(() => {
    const curPlan = plans.filter((p) => p.id === plan);
    if (curPlan.length > 0) {
      const attr = curPlan[0].attributes;
      setTitle(attr ? attr.name : '');
    }
  }, [plan, plans]);

  useEffect(() => {
    if (isElectron && importStatus) {
      setAddProject(!importStatus.complete);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [importStatus]);

  const defaultViewActions = ['', NavChoice.Setup, NavChoice.NotSetup];
  const nonAdminView: string[] = [
    NavChoice.Organization,
    NavChoice.Tasks,
    NavChoice.Settings,
    NavChoice.Export,
    NavChoice.Import,
    NavChoice.Integrations,
  ];

  useEffect(() => {
    if (
      content !== NavChoice.UsersAndGroups &&
      content !== NavChoice.Organization &&
      (defaultViewActions.indexOf(content) !== -1 ||
        ((projRole !== 'admin' || isApp) &&
          nonAdminView.indexOf(content) === -1) ||
        (content === NavChoice.Tasks && !isApp))
    ) {
      defaultView();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [isApp, orgRole, projRole, projOptions, transcribe, content]);

  useEffect(() => {
    if (!group || group === '') return;
    const groupRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'group', id: group })
    ) as Group;
    if (groupRec) {
      const attr = groupRec.attributes;
      setTitle(attr ? attr.name : '');
      if (content === NavChoice.UsersAndGroups) setContent('group');
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [group]);

  useEffect(() => {
    const target = deepLink({
      organization,
      project,
      group,
      plan,
      tab,
      choice,
      content,
      keyMap,
    });
    if (target && target !== history.location.pathname) {
      history.push(target);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [
    project,
    organization,
    choice,
    content,
    plan,
    group,
    tab,
    addProject,
    busy,
  ]);

  useEffect(() => {
    if (remote) {
      // remote is null if offline
      if (timer.current === undefined)
        timer.current = setInterval(() => {
          const isBusy = remote.requestQueue.length !== 0;
          if (busy !== isBusy) setBusy(isBusy);
        }, 1000);
      if (syncTimer.current === undefined) {
        if (!busy && !doSave) {
          dateChanges(auth, keyMap, remote, memory, schema, fingerprint);
        }
        syncTimer.current = setInterval(() => {
          if (!busy && !doSave) {
            dateChanges(auth, keyMap, remote, memory, schema, fingerprint);
          }
        }, 1000 * 100);
      }
      return () => {
        if (timer.current) {
          clearInterval(timer.current);
          timer.current = undefined;
        }
        if (syncTimer.current) {
          clearInterval(syncTimer.current);
          syncTimer.current = undefined;
        }
      };
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [remote, busy, doSave, curOrg]);

  useEffect(() => {
    const media = mediafiles.filter((m) => {
      const planid = related(m, 'plan');
      if (planid !== null) {
        const plan = memory.cache.query((q: QueryBuilder) =>
          q.findRecord({ type: 'plan', id: related(m, 'plan') })
        );
        return related(plan, 'project') === project && related(m, 'passage');
      }
      return false;
    });
    const propsal = media.length > 0 && !busy;
    if (propsal !== transcribe) setTranscribe(propsal);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [mediafiles, project, busy]);

  if (view === 'Error') return <Redirect to="/error" />;
  if (view === 'Profile') return <Redirect to="/profile" />;
  if (view === 'Loading') return <Redirect to="/loading" />;
  if (view === 'Logout') return <Redirect to="/logout" />;
  if (view === 'Access') return <Redirect to="/" />;

  // When the user uses the back button or directly naviagets to a page
  if (history.action === 'POP') {
    const target = deepLink({
      organization,
      project,
      group,
      plan,
      tab,
      choice,
      content,
      keyMap,
    });
    if (target && target !== history.location.pathname) {
      localStorage.setItem('url', history.location.pathname);
      history.replace(history.location.pathname);
    }
  }

  if (!auth || !auth.isAuthenticated(offline) || !orbitLoaded)
    return <Redirect to="/" />;

  const planChoices: string[] = [NavChoice.Scripture, NavChoice.General];
  // reset location based on deep link (saved url)
  const url = localStorage.getItem('url');
  if (
    orbitLoaded &&
    url &&
    view === '' &&
    (localStorage.getItem('isLoggedIn') === 'true' || isElectron)
  ) {
    const parts = url.split('/');
    const base = 1;
    const UrlOrgPart = base + 1;
    if (parts.length > UrlOrgPart) {
      const orgId = remoteIdGuid('organization', parts[UrlOrgPart], keyMap);
      setOrganization(orgId);
    }
    const UrlProjPart = base + 3;
    if (parts.length > UrlProjPart) {
      const projId = remoteIdGuid('project', parts[UrlProjPart], keyMap);
      setProject(projId);
    }
    let urlChoice = '';
    const UrlChoicePart = base + 2;
    let pltype: string | null = null;
    if (parts.length > UrlChoicePart) {
      urlChoice = parts[UrlChoicePart];
      if (planChoices.indexOf(urlChoice) !== -1) {
        urlChoice = NavChoice.Plans;
        pltype = urlChoice.substr(0, urlChoice.indexOf('-'));
      } else handleChoice(urlChoice);
    }
    if (urlChoice === NavChoice.Plans) {
      const UrlPlanPart = base + 4;
      if (parts.length > UrlPlanPart) {
        const planId = remoteIdGuid('plan', parts[UrlPlanPart], keyMap);
        setPlan(planId);
        handlePlanType(pltype);
      }
      const UrlPlanTabPart = base + 5;
      if (parts.length > UrlPlanTabPart) {
        setTab(parseInt(parts[UrlPlanTabPart]));
      }
    } else if (urlChoice === NavChoice.UsersAndGroups) {
      const UrlGroupTabPart = base + 4;
      if (parts.length > UrlGroupTabPart) {
        setTab(parseInt(parts[UrlGroupTabPart]));
      }
      const UrlGroupPart = base + 5;
      if (parts.length > UrlGroupPart) {
        const groupId = remoteIdGuid('group', parts[UrlGroupPart], keyMap);
        setGroup(groupId);
      }
    } else if (urlChoice === NavChoice.Tasks) {
      const UrlTaskTabPart = base + 4;
      if (parts.length > UrlTaskTabPart) {
        setTab(parseInt(parts[UrlTaskTabPart]));
      }
    }
  }

  const transcriberIcons = isApp
    ? [<ListIcon />]
    : [<PlanIcon />, <TeamIcon />, <MediaIcon />, <ReportIcon />];

  const projectIcons = [
    <SettingsIcon />,
    <DownloadIcon />,
    <UploadIcon />,
    <IntegrationIcon />,
  ];
  const drawer = (drawerId: string) => (
    <div>
      <div className={classes.toolbar}>
        <div className={classes.organization}>
          <div className={classes.avatar}>
            {orgAvatar ? (
              <Avatar variant="square" src={orgAvatar} />
            ) : curOrg != null && orgOptions.length > 0 ? (
              <Avatar variant="square">
                {makeAbbr(orgOptions[curOrg].label)}
              </Avatar>
            ) : (
              <></>
            )}
          </div>
          {!mini && (
            <div className={classes.select}>
              <ReactSelect
                id={'orgs' + drawerId}
                suggestions={orgOptions}
                current={curOrg}
                onCommit={commitOrg}
              />
            </div>
          )}
        </div>
      </div>
      {curOrg === null || (
        <>
          <Divider />
          <List>
            {(isApp
              ? [t.organization]
              : [t.usersAndGroups, t.organization]
            ).map((text, index) => (
              <Tooltip key={text} title={text}>
                <ListItem
                  button
                  key={text}
                  selected={toSlug(text) === choice}
                  onClick={choiceClick(text)}
                >
                  <ListItemIcon>
                    {index === 0 && !isApp ? (
                      <GroupIcon />
                    ) : (
                      <OrganizationIcon />
                    )}
                  </ListItemIcon>
                  <ListItemText primary={text} />
                </ListItem>
              </Tooltip>
            ))}
          </List>
          <Divider />
          {!mini && (
            <div className={classes.project}>
              <div className={classes.header}>
                <Typography variant="h6">{t.project}</Typography>
                {!isApp && (orgRole === 'admin' || projRole === 'admin') && (
                  <>
                    <div className={classes.grow}>{'\u00A0'}</div>
                    <IconButton size="small" onClick={handleAddProject}>
                      <AddIcon />
                    </IconButton>
                  </>
                )}
              </div>
              {projOptions.length > 0 && (
                <div className={classes.contained}>
                  <div className={classes.select}>
                    <ReactSelect
                      id={'projects' + drawerId}
                      suggestions={projOptions}
                      current={curProj}
                      onCommit={commitProj}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          <List>
            {(isApp ? [t.tasks] : [t.plans, t.team, t.media, t.reports]).map(
              (text, index) => (
                <Tooltip key={text} title={text}>
                  <span>
                    <ListItem
                      button
                      key={text}
                      selected={toSlug(text) === choice}
                      onClick={choiceClick(text)}
                      disabled={curProj === null}
                    >
                      <ListItemIcon>{transcriberIcons[index]}</ListItemIcon>
                      <ListItemText primary={text} />
                    </ListItem>
                  </span>
                </Tooltip>
              )
            )}
          </List>
          <Divider />
          <List>
            {[t.settings, t.export, t.import, t.integrations].map(
              (text, index) => (
                <Tooltip key={text} title={text}>
                  <span>
                    <ListItem
                      button
                      key={text}
                      selected={toSlug(text) === choice}
                      onClick={choiceClick(text)}
                      disabled={curProj === null}
                    >
                      <ListItemIcon>{projectIcons[index]}</ListItemIcon>
                      <ListItemText primary={text} />
                    </ListItem>
                  </span>
                </Tooltip>
              )
            )}
          </List>
        </>
      )}
    </div>
  );

  if (!orbitLoaded) return <Redirect to="/loading" />;

  let components: componentType = {};
  components[NavChoice.Organization] = (
    <OrgSettings
      noMargin={true}
      {...props}
      add={addOrg}
      finishAdd={handleFinishOrgAdd}
    />
  );
  const GroupTabs = React.lazy(() => import('../components/GroupTabs'));
  components[NavChoice.UsersAndGroups] = LazyLoad({ ...props })(GroupTabs);
  components[NavChoice.Media] = (
    <MediaTab
      {...props}
      projectplans={plans.filter((p) => related(p, 'project') === project)}
      planColumn={true}
    />
  );
  components[NavChoice.Export] = (
    <TranscriptionTab
      {...props}
      projectPlans={plans.filter((p) => related(p, 'project') === project)}
      planColumn={true}
    />
  );
  components[NavChoice.Import] = <ImportTab {...props} />;
  components[NavChoice.Plans] = (
    <PlanTable {...props} displaySet={handlePlanType} />
  );
  components[NavChoice.Scripture] = (
    <PlanTabs
      {...props}
      changed={changed}
      setChanged={setChanged}
      checkSaved={checkSavedFn}
    />
  );
  components[NavChoice.General] = (
    <PlanTabs
      {...props}
      bookCol={-1}
      changed={changed}
      setChanged={setChanged}
      checkSaved={checkSavedFn}
    />
  );
  components[NavChoice.Team] = <Team {...props} detail={true} />;
  const ProjectSettings = React.lazy(() =>
    import('../components/ProjectSettings')
  );
  components[NavChoice.Settings] = LazyLoad({
    ...props,
    noMargin: true,
    add: addProject,
    finishAdd: handleFinishAdd,
  })(ProjectSettings);
  components[NavChoice.Integrations] = <IntegrationPanel {...props} />; // Don't lazy load this...it causes problems
  components['group'] = <GroupSettings {...props} />;
  const Visualize = React.lazy(() => import('../components/Visualize'));
  components[NavChoice.Reports] = LazyLoad({ ...props })(Visualize);
  components[NavChoice.None] = <Busy />;
  components[NavChoice.Setup] = <Setup />;
  components[NavChoice.NotSetup] = <NotSetup />;

  components[NavChoice.Tasks] = (
    <TranscriberProvider {...props}>
      <div className={classes.panel2}>
        <div className={clsx({ [classes.topFilter]: topFilter })}>
          <TaskTable auth={auth} onFilter={handleTopFilter} />
        </div>
        {!topFilter && (
          <div className={classes.topTranscriber}>
            <Transcriber auth={auth} />
          </div>
        )}
      </div>
    </TranscriberProvider>
  );

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar
        position="fixed"
        className={clsx({
          [classes.appBarShift]: mini,
          [classes.appBar]: !mini,
        })}
        color="inherit"
      >
        <>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="Open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              className={classes.menuButton}
            >
              <MenuIcon />
            </IconButton>
            <img src={logo} className={classes.logo} alt="logo" />
            <div>
              <Typography variant="overline" className={classes.appName}>
                {isApp ? t.transcribe : t.admin}
              </Typography>
              <br />
              <Typography variant="h6" noWrap>
                {title}
              </Typography>
            </div>
            <div className={classes.grow}>{'\u00A0'}</div>

            {!isApp ? (
              <div className={classes.navButton}>
                <Typography>{t.switchTo + '\u00A0'}</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSwitch}
                  disabled={!transcribe}
                >
                  {t.transcribe}
                </Button>
              </div>
            ) : (projRole === 'admin' || orgRole === 'admin') && !isElectron ? (
              <div className={classes.navButton}>
                <Typography>{t.switchTo + '\u00A0'}</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSwitch}
                  disabled={busy || doSave}
                >
                  {t.admin}
                </Button>
              </div>
            ) : (
              isApp &&
              online &&
              (projRole === 'admin' || orgRole === 'admin') && (
                <div className={classes.navButton}>
                  <Typography>{t.switchTo + '\u00A0'}</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAdmin(API_CONFIG.endpoint)}
                  >
                    {t.goOnline}
                  </Button>
                </div>
              )
            )}
            {'\u00A0'}
            <HelpMenu online={online} />
            <UserMenu action={menuAction} />
          </Toolbar>
          {(!busy && !importexportBusy && !doSave) || (
            <AppBar
              position="fixed"
              className={classes.progress}
              color="inherit"
            >
              <LinearProgress variant="indeterminate" />
            </AppBar>
          )}
        </>
      </AppBar>
      <nav
        className={clsx(classes.drawer, { [classes.drawerMini]: mini })}
        aria-label="app frames"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Hidden smUp implementation="css">
          <Drawer
            variant="temporary"
            anchor={theme.direction === 'rtl' ? 'right' : 'left'}
            open={mobileOpen}
            onClose={handleDrawerToggle}
            className={clsx(classes.drawer, { [classes.drawerMini]: mini })}
            classes={{
              paper: clsx({
                [classes.drawerMini]: mini,
                [classes.drawerPaper]: !mini,
              }),
            }}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
          >
            {drawer('1')}
          </Drawer>
        </Hidden>
        <Hidden xsDown implementation="css">
          <Drawer
            className={clsx(classes.drawer, { [classes.drawerMini]: mini })}
            classes={{
              paper: clsx({
                [classes.drawerMini]: mini,
                [classes.drawerPaper]: !mini,
              }),
            }}
            variant="permanent"
            open
          >
            {drawer('2')}
          </Drawer>
        </Hidden>
      </nav>
      <main className={classes.content}>{components[content]}</main>
      {alertOpen && (
        <Confirm
          title={t.UnsavedData}
          text={t.saveFirst}
          yesResponse={handleSaveConfirmed}
          noResponse={handleSaveRefused}
        />
      )}
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
  orbitLoaded: state.orbit.loaded,
  importStatus: state.importexport.importexportStatus,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      resetOrbitError: actions.resetOrbitError,
      orbitError: actions.doOrbitError,
    },
    dispatch
  ),
});

const mapRecordsToProps = {
  organizationMemberships: (q: QueryBuilder) =>
    q.findRecords('organizationmembership'),
  plans: (q: QueryBuilder) => q.findRecords('plan'),
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
};

export default withData(mapRecordsToProps)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(withBucket(ResponsiveDrawer)) as any
) as any;
