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
  MediaDescription,
  OrganizationMembership,
  GroupMembership,
  Role,
  RoleNames,
} from '../model';
import * as actions from '../store';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
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
import ReportIcon from '@material-ui/icons/Assessment';
import MenuIcon from '@material-ui/icons/Menu';
import AddIcon from '@material-ui/icons/Add';
import ListIcon from '@material-ui/icons/List';
import SwapAppIcon from '@material-ui/icons/ExitToApp';
import ReactSelect, { OptionType } from '../components/ReactSelect';
import Auth from '../auth/Auth';
import { related, hasRelated, slug, remoteIdGuid } from '../utils';
import UserMenu from '../components/UserMenu';
import HelpMenu from '../components/HelpMenu';
import OrgSettings from '../components/OrgSettings';
import LazyLoad from '../hoc/LazyLoad';
import PlanTabs from '../components/PlanTabs';
import MediaTab from '../components/MediaTab';
import Team from '../components/GroupSettings/Team';
import GroupSettings from '../components/GroupSettings/GroupSettings';
import Confirm from '../components/AlertDialog';
import TaskTable from '../components/TaskTable';
import Transcriber from '../components/Transcriber';
import { setDefaultProj, deepLink } from '../utils';
import logo from './transcriber10.png';
import { AUTH_CONFIG } from '../auth/auth0-variables';
import { API_CONFIG } from '../api-variable';
import { TaskItemWidth } from '../components/TaskTable';

export const DrawerWidth = 240;

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
    header: {
      display: 'flex',
      flexDirection: 'row',
      paddingRight: theme.spacing(1.5),
    },
    appBar: {
      marginLeft: DrawerWidth,
      [theme.breakpoints.up('sm')]: {
        width: `calc(100% - ${DrawerWidth}px)`,
      },
    },
    menuButton: {
      marginRight: theme.spacing(2),
      [theme.breakpoints.up('sm')]: {
        display: 'none',
      },
    },
    backButton: {
      marginRight: theme.spacing(2),
      color: theme.palette.primary.contrastText,
    },
    toolbar: theme.mixins.toolbar,
    drawerPaper: {
      width: DrawerWidth,
    },
    content: {
      flexGrow: 1,
      paddingTop: theme.spacing(10),
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
    },
    panel2: {
      display: 'flex',
      flexDirection: 'row',
    },
    topFilter: {
      zIndex: 2,
      position: 'absolute',
      left: DrawerWidth,
      backgroundColor: 'white',
    },
    topTranscriber: {
      zIndex: 1,
      position: 'absolute',
      left: DrawerWidth + TaskItemWidth + theme.spacing(2),
    },
    progress: {
      width: '100%',
    },
  })
);

interface componentType {
  [key: string]: JSX.Element | string;
}

interface IStateProps {
  t: IMainStrings;
  orbitLoaded: boolean;
  orbitStatus: number;
}

interface IDispatchProps {
  resetOrbitError: typeof actions.resetOrbitError;
}

interface IRecordProps {
  organizations: Array<Organization>;
  organizationMemberships: Array<OrganizationMembership>;
  projects: Array<Project>;
  plans: Array<Plan>;
  groupMemberships: Array<GroupMembership>;
  roles: Array<Role>;
}

interface IProps extends IStateProps, IDispatchProps, IRecordProps {
  auth: Auth;
  history: {
    action: string;
    location: {
      hash: string;
      pathname: string;
    };
    push: (path: string) => void;
  };
}

export function ResponsiveDrawer(props: IProps) {
  const {
    auth,
    t,
    history,
    organizations,
    projects,
    plans,
    orbitLoaded,
    orbitStatus,
    organizationMemberships,
    groupMemberships,
    roles,
  } = props;
  const classes = useStyles();
  const theme = useTheme();
  const [keyMap] = useGlobal('keyMap');
  const [memory] = useGlobal('memory');
  const [remote] = useGlobal('remote');
  const [bucket] = useGlobal('bucket');
  const [user] = useGlobal('user');
  const [busy, setBusy] = useGlobal('remoteBusy');
  const [organization, setOrganization] = useGlobal('organization');
  const [orgRole, setOrgRole] = useGlobal('orgRole');
  const [group, setGroup] = useGlobal('group');
  const [project, setProject] = useGlobal('project');
  const [projRole, setProjRole] = useGlobal('projRole');
  const [plan, setPlan] = useGlobal('plan');
  const [tab, setTab] = useGlobal('tab');
  const [choice, setChoice] = useState(API_CONFIG.isApp ? slug(t.tasks) : '');
  const [content, setContent] = useState(API_CONFIG.isApp ? slug(t.tasks) : '');
  const [orgOptions, setOrgOptions] = useState(Array<OptionType>());
  const [curOrg, setCurOrg] = useState<number | null>(null);
  const [orgAvatar, setOrgAvatar] = useState<string>('');
  const [projOptions, setProjOptions] = useState(Array<OptionType>());
  const [curProj, setCurProj] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [addProject, setAddProject] = useState(false);
  const [addOrg, setAddOrg] = useState(false);
  const [title, setTitle] = useState(
    API_CONFIG.isApp ? t.silTranscriber : t.silTranscriberAdmin
  );
  const [view, setView] = useState('');
  const [changed, setChanged] = useState(false);
  const [exitChoice, setExitChoice] = useState('');
  const [mediaDesc, setMediaDesc] = useState<MediaDescription>();
  const saveConfirm = useRef<() => any>();
  const [alertOpen, setAlertOpen] = useState(false);
  const [topFilter, setTopFilter] = useState(false);
  const newOrgRef = useRef<any>();
  const timer = React.useRef<NodeJS.Timeout>();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleChoice = (choice: string) => {
    localStorage.removeItem('url');
    setAddProject(false);
    setChoice(slug(choice));
    setContent(slug(choice));
    setTitle(choice);
    if (choice === t.usersAndGroups) {
      if (tab > 1) {
        setTab(0);
      }
      setGroup('');
    }
  };

  const handleCommitOrg = (value: string) => {
    localStorage.removeItem('url');
    if (value === t.newOrganization) {
      // if (newOrgRef.current) newOrgRef.current.click();
      setAddOrg(true);
      setContent(slug(t.organization));
    } else {
      if (value !== organization) setCurProj(null);
      setOrganization(value);
      setDefaultProj(value, memory, setProject);
      setAddProject(false);
      setChoice(API_CONFIG.isApp ? slug(t.tasks) : slug(t.plans));
      setContent(API_CONFIG.isApp ? slug(t.tasks) : slug(t.plans));
      setGroup('');
    }
  };

  const handleFinishOrgAdd = () => {
    setAddOrg(false);
  };

  const handleCommitProj = (value: string) => {
    localStorage.removeItem('url');
    setAddProject(false);
    setProject(value);
    setContent(API_CONFIG.isApp ? slug(t.tasks) : slug(t.plans));
    setChoice(API_CONFIG.isApp ? slug(t.tasks) : slug(t.plans));
    setGroup('');
    setTitle(t.projectSummary);
  };

  const handlePlanType = (value: string | null) => {
    localStorage.removeItem('url');
    if (!value || value.toLocaleLowerCase() === 'scripture') {
      setContent('scripture-plan');
    } else {
      setContent('other-plan');
    }
  };

  const handleAddProject = () => {
    localStorage.removeItem('url');
    setAddProject(true);
    setProject('');
    setContent(slug(t.settings));
    setTitle(t.addProject);
  };

  const handleFinishAdd = () => {
    setAddProject(false);
    setChoice(slug(t.plans));
    setContent(slug(t.plans));
  };

  const handleUserMenuAction = (what: string) => {
    localStorage.setItem('url', history.location.pathname);
    if (!/Close/i.test(what)) {
      if (/Clear/i.test(what)) {
        bucket.setItem('remote-requests', []);
      }
      setView(what);
    }
  };

  const checkSavedEv = (method: () => any) => () => {
    checkSavedFn(method);
  };
  const checkSavedFn = (method: () => any) => {
    if (changed) {
      saveConfirm.current = method;
      setAlertOpen(true);
    } else {
      method();
    }
  };
  const handleUnsaveConfirmed = () => {
    if (saveConfirm.current) saveConfirm.current();
    saveConfirm.current = undefined;
    setAlertOpen(false);
    setChanged(false);
  };
  const handleUnsaveRefused = () => {
    saveConfirm.current = undefined;
    setAlertOpen(false);
  };
  const getRole = (table: Record[], relate: string, id: string) => {
    const memberRecs = table.filter(
      tbl => related(tbl, 'user') === user && related(tbl, relate) === id
    );
    if (memberRecs.length === 1) {
      const roleId = related(memberRecs[0], 'role');
      const roleRecs = roles.filter(r => r.id === roleId);
      if (roleRecs.length === 1) {
        const attr = roleRecs[0].attributes;
        if (attr && attr.roleName) return attr.roleName.toLocaleLowerCase();
      }
    }
    return '';
  };
  const handleTopFilter = (top: boolean) => setTopFilter(top);

  useEffect(() => {
    const orgOpts = organizations
      .filter(o => hasRelated(o, 'users', user) && o.attributes)
      .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1))
      .map((o: Organization) => {
        return {
          value: o.id,
          label: o.attributes.name,
        };
      });
    setOrgOptions(
      API_CONFIG.isApp
        ? orgOpts
        : orgOpts.concat({
            value: t.newOrganization,
            label: t.newOrganization + '    \uFF0B',
            // or \u2795
          })
    );
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [organizations, organization, user]);

  useEffect(() => {
    if (orgOptions) {
      const cur = orgOptions.map(oo => oo.value).indexOf(organization);
      if (cur !== -1) setCurOrg(cur);
    }
    setOrgRole(getRole(organizationMemberships, 'organization', organization));
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [orgOptions, organization]);

  useEffect(() => {
    const orgRec = organizations.filter(o => o.id === organization);
    if (orgRec.length > 0) {
      const attr = orgRec[0].attributes;
      setOrgAvatar(attr && attr.logoUrl ? attr.logoUrl : '');
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [organization, curOrg]);

  useEffect(() => {
    const projOpts = projects
      .filter(p => related(p, 'organization') === organization && p.attributes)
      .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1))
      .map(p => {
        return {
          value: p.id,
          label: p.attributes.name,
        };
      });
    setProjOptions(projOpts);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [projects, organization, addProject]);

  useEffect(() => {
    const projKeys = projOptions.map(o => o.value);
    if (projKeys.length === 0) {
      setCurProj(null);
      return;
    }
    const cur = projKeys.indexOf(project);
    if (addProject || cur === -1) {
      setCurProj(null);
    } else {
      setCurProj(cur);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [projOptions, project, addProject]);

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
    const curPlan = plans.filter(p => p.id === plan);
    if (curPlan.length > 0) {
      const attr = curPlan[0].attributes;
      setTitle(attr ? attr.name : '');
    }
  }, [plan, plans]);

  useEffect(() => {
    if (!group || group === '') return;
    const groupRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'group', id: group })
    ) as Group;
    if (groupRec) {
      const attr = groupRec.attributes;
      setTitle(attr ? attr.name : '');
      if (content === slug(t.usersAndGroups)) setContent('group');
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
      setPlan,
      setTab,
      t,
    });
    if (target) history.push(target);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [project, organization, choice, content, plan, group, tab]);

  useEffect(() => {
    if (orbitStatus >= 400 && orbitStatus < 500) setView('Logout');
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [orbitStatus]);

  useEffect(() => {
    if (remote) {
      // remote is null if offline
      timer.current = setInterval(() => {
        const isBusy = remote.requestQueue.length !== 0;
        if (busy !== isBusy) setBusy(isBusy);
      }, 1000);
      return () => {
        if (timer.current) clearInterval(timer.current);
      };
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [remote, busy]);

  if (view === 'Profile') return <Redirect to="/profile" />;
  if (view === 'Loading') return <Redirect to="/loading" />;
  if (view === 'Logout') return <Redirect to="/logout" />;

  // When the user uses the back button or directly naviagets to a page
  if (history.action === 'POP') {
    localStorage.setItem('url', history.location.pathname);
  }

  if (!auth.isAuthenticated() || !orbitLoaded) return <Redirect to="/" />;

  // reset location based on deep link (saved url)
  const url = localStorage.getItem('url');
  if (orbitLoaded && url) {
    const parts = url.split('/');
    const base = 1;
    const UrlOrgPart = base + 1;
    const orgId = remoteIdGuid('organization', parts[UrlOrgPart], keyMap);
    if (parts.length > UrlOrgPart && organization !== orgId) {
      setOrganization(orgId);
    }
    let urlChoice = '';
    const UrlChoicePart = base + 2;
    if (parts.length > UrlChoicePart && content !== parts[UrlChoicePart]) {
      const value = slug(parts[UrlChoicePart]);
      urlChoice =
        ['scripture-plan', 'other-plan'].indexOf(value) !== -1
          ? slug(t.plans)
          : value;
      setChoice(urlChoice);
      setContent(value);
    }
    const UrlProjPart = base + 3;
    const projId = remoteIdGuid('project', parts[UrlProjPart], keyMap);
    if (parts.length > UrlProjPart && project !== projId) {
      setProject(projId);
    }
    if (urlChoice === slug(t.plans)) {
      const UrlPlanPart = base + 4;
      const planId = remoteIdGuid('plan', parts[UrlPlanPart], keyMap);
      if (parts.length > UrlPlanPart && plan !== planId) {
        setPlan(planId);
      }
      const UrlPlanTabPart = base + 5;
      if (
        parts.length > UrlPlanTabPart &&
        tab.toString() !== parts[UrlPlanTabPart]
      ) {
        setTab(parseInt(parts[UrlPlanTabPart]));
      }
    } else if (urlChoice === slug(t.usersAndGroups)) {
      const UrlGroupTabPart = base + 4;
      if (
        parts.length > UrlGroupTabPart &&
        tab.toString() !== parts[UrlGroupTabPart]
      ) {
        setTab(parseInt(parts[UrlGroupTabPart]));
      }
      const UrlGroupPart = base + 5;
      const groupId = remoteIdGuid('group', parts[UrlGroupPart], keyMap);
      if (parts.length > UrlGroupPart && group !== groupId) {
        setGroup(groupId);
      }
    } else if (urlChoice === slug(t.myTasks)) {
      const UrlTaskTabPart = base + 4;
      if (
        parts.length > UrlTaskTabPart &&
        tab.toString() !== parts[UrlTaskTabPart]
      ) {
        setTab(parseInt(parts[UrlTaskTabPart]));
      }
    }
  }

  const transcriberIcons = API_CONFIG.isApp
    ? [<ListIcon />]
    : [<PlanIcon />, <TeamIcon />, <MediaIcon />, <ReportIcon />];

  const drawer = (
    <div>
      <div className={classes.toolbar}>
        <div className={classes.organization}>
          <div className={classes.avatar}>
            {orgAvatar && orgAvatar.startsWith('http') ? (
              <Avatar src={orgAvatar} />
            ) : (
              <OrganizationIcon />
            )}
          </div>
          <div className={classes.select}>
            <ReactSelect
              suggestions={orgOptions}
              current={curOrg}
              onCommit={(v: string, e: any, callback: () => void) =>
                checkSavedFn(() => {
                  handleCommitOrg(v);
                  callback();
                })
              }
            />
          </div>
        </div>
      </div>
      {curOrg === null || (
        <>
          <Divider />
          <List>
            {(API_CONFIG.isApp
              ? [t.organization]
              : [t.usersAndGroups, t.organization]
            ).map((text, index) => (
              <ListItem
                button
                key={text}
                selected={slug(text) === choice}
                onClick={checkSavedEv(() => handleChoice(text))}
              >
                <ListItemIcon>
                  {index === 0 && !API_CONFIG.isApp ? (
                    <GroupIcon />
                  ) : (
                    <OrganizationIcon />
                  )}
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <div className={classes.project}>
            <div className={classes.header}>
              <Typography variant="h6">{t.project}</Typography>
              {!API_CONFIG.isApp &&
                (orgRole === 'admin' || projRole === 'admin') && (
                  <>
                    <div className={classes.grow}>{'\u00A0'}</div>
                    <IconButton size="small" onClick={handleAddProject}>
                      <AddIcon />
                    </IconButton>
                  </>
                )}
            </div>
            {projOptions.length <= 0 || (
              <div className={classes.contained}>
                <div className={classes.select}>
                  <ReactSelect
                    suggestions={projOptions}
                    current={curProj}
                    onCommit={(v: string, e: any, callback: () => void) =>
                      checkSavedFn(() => {
                        handleCommitProj(v);
                        callback();
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
          {curProj === null || (
            <div>
              <List>
                {(API_CONFIG.isApp
                  ? [t.tasks]
                  : [t.plans, t.team, t.media, t.reports]
                ).map((text, index) => (
                  <ListItem
                    button
                    key={text}
                    selected={slug(text) === choice}
                    onClick={checkSavedEv(() => handleChoice(text))}
                  >
                    <ListItemIcon>{transcriberIcons[index]}</ListItemIcon>
                    <ListItemText primary={text} />
                  </ListItem>
                ))}
              </List>
              <Divider />
              <List>
                {[t.settings, t.integrations].map((text, index) => (
                  <ListItem
                    button
                    key={text}
                    selected={slug(text) === choice}
                    onClick={checkSavedEv(() => handleChoice(text))}
                  >
                    <ListItemIcon>
                      {index % 2 === 0 ? <SettingsIcon /> : <IntegrationIcon />}
                    </ListItemIcon>
                    <ListItemText primary={text} />
                  </ListItem>
                ))}
              </List>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (!orbitLoaded) return <Redirect to="/loading" />;

  let components: componentType = {};
  components[slug(t.organization)] = (
    <OrgSettings
      noMargin={true}
      {...props}
      add={addOrg}
      finishAdd={handleFinishOrgAdd}
    />
  );
  const GroupTabs = React.lazy(() => import('../components/GroupTabs'));
  components[slug(t.usersAndGroups)] = LazyLoad({ ...props })(GroupTabs);
  components[slug(t.media)] = (
    <MediaTab
      {...props}
      projectplans={plans.filter(p => related(p, 'project') === project)}
      planColumn={true}
    />
  );
  const PlanTable = React.lazy(() => import('../components/PlanTable'));
  components[slug(t.plans)] = LazyLoad({
    ...props,
    displaySet: handlePlanType,
  })(PlanTable);
  components['scripture-plan'] = (
    <PlanTabs {...props} setChanged={setChanged} checkSaved={checkSavedFn} />
  );
  components['other-plan'] = (
    <PlanTabs
      {...props}
      bookCol={-1}
      setChanged={setChanged}
      checkSaved={checkSavedFn}
    />
  );
  components[slug(t.team)] = <Team {...props} detail={true} />;
  const ProjectSettings = React.lazy(() =>
    import('../components/ProjectSettings')
  );
  components[slug(t.settings)] = LazyLoad({
    ...props,
    noMargin: true,
    add: addProject,
    finishAdd: handleFinishAdd,
  })(ProjectSettings);
  const IntegrationPanel = React.lazy(() =>
    import('../components/Integration')
  );
  components[slug(t.integrations)] = LazyLoad({ ...props })(IntegrationPanel);
  components['group'] = <GroupSettings {...props} />;
  const Visualize = React.lazy(() => import('../components/Visualize'));
  components[slug(t.reports)] = LazyLoad({ ...props })(Visualize);
  components['none'] = <></>;
  components[slug(t.tasks)] = (
    <TaskTable
      {...props}
      transcriber={(desc: MediaDescription) => {
        setMediaDesc(desc);
        setExitChoice(t.tasks);
        handleChoice(RoleNames.Transcriber);
      }}
    />
  );

  if (mediaDesc) {
    components['transcriber'] = (
      <div className={classes.panel2}>
        <div className={clsx({ [classes.topFilter]: topFilter })}>
          <TaskTable
            {...props}
            onFilter={handleTopFilter}
            curDesc={mediaDesc}
            transcriber={(desc: MediaDescription) => {
              setMediaDesc(desc);
              setExitChoice(t.tasks);
              handleChoice(RoleNames.Transcriber);
            }}
          />
        </div>
        <div className={classes.topTranscriber}>
          <Transcriber
            {...mediaDesc}
            auth={auth}
            done={() => handleChoice(slug(exitChoice))}
          />
        </div>
      </div>
    );
  }

  let swapTarget = deepLink({
    organization,
    project,
    plan,
    group,
    tab,
    choice,
    content,
    keyMap,
    t,
  });
  if (API_CONFIG.isApp && swapTarget) {
    swapTarget =
      AUTH_CONFIG.adminEndpoint +
      swapTarget.replace(slug(t.tasks), slug(t.plans));
  } else if (swapTarget) {
    const part = swapTarget.split('/');
    part[3] = slug(t.tasks);
    swapTarget = AUTH_CONFIG.appEndpoint + part.join('/');
  } else {
    swapTarget = API_CONFIG.isApp
      ? AUTH_CONFIG.adminEndpoint
      : AUTH_CONFIG.appEndpoint;
  }

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar position="fixed" className={classes.appBar}>
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
          <Typography variant="h6" noWrap>
            {title}
          </Typography>
          <div className={classes.grow}>{'\u00A0'}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Typography>{'Organization: ' + orgRole}</Typography>
            <Typography>
              {'Project: ' + (projRole === 'admin' ? 'owner' : projRole)}
            </Typography>
          </div>
          {'\u00A0'}
          <a
            href={swapTarget}
            style={{ textDecoration: 'none' }}
            target="_blank"
            rel="noopener noreferrer"
            title={API_CONFIG.isApp ? t.switchToAdmin : t.switchToApp}
          >
            <IconButton style={{ color: 'white' }}>
              <SwapAppIcon />
            </IconButton>
          </a>
          <HelpMenu />
          <UserMenu
            action={(v: string) => checkSavedFn(() => handleUserMenuAction(v))}
            auth={auth}
          />
        </Toolbar>
      </AppBar>
      <nav className={classes.drawer} aria-label="Project folders">
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Hidden smUp implementation="css">
          <Drawer
            variant="temporary"
            anchor={theme.direction === 'rtl' ? 'right' : 'left'}
            open={mobileOpen}
            onClose={handleDrawerToggle}
            classes={{
              paper: classes.drawerPaper,
            }}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
          >
            {drawer}
          </Drawer>
        </Hidden>
        <Hidden xsDown implementation="css">
          <Drawer
            classes={{
              paper: classes.drawerPaper,
            }}
            variant="permanent"
            open
          >
            {drawer}
          </Drawer>
        </Hidden>
      </nav>
      <main className={classes.content}>
        {!busy || (
          <div className={classes.progress}>
            <LinearProgress variant="indeterminate" />
          </div>
        )}
        {components[content]}
      </main>
      {alertOpen ? (
        <Confirm
          title={t.planUnsaved}
          text={t.loseData}
          yesResponse={handleUnsaveConfirmed}
          noResponse={handleUnsaveRefused}
        />
      ) : (
        <></>
      )}
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
      <a
        ref={newOrgRef}
        href={
          AUTH_CONFIG.newOrgApp +
          '/?callback=' +
          AUTH_CONFIG.callbackUrl
            .replace('https://', '')
            .replace('/callback', '') +
          '#access_token=' +
          auth.accessToken
        }
      ></a>
    </div>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
  orbitLoaded: state.orbit.loaded,
  orbitStatus: state.orbit.status,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      resetOrbitError: actions.resetOrbitError,
    },
    dispatch
  ),
});

const mapRecordsToProps = {
  organizations: (q: QueryBuilder) => q.findRecords('organization'),
  organizationMemberships: (q: QueryBuilder) =>
    q.findRecords('organizationmembership'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  plans: (q: QueryBuilder) => q.findRecords('plan'),
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(ResponsiveDrawer) as any
) as any;
