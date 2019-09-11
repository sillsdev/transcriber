import React, { useState, useEffect, useRef } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
// import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  IState,
  IMainStrings,
  Organization,
  Project,
  Plan,
  Group,
} from '../model';
// import * as actions from '../store';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
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
import HelpIcon from '@material-ui/icons/Help';
import MenuIcon from '@material-ui/icons/Menu';
import AddIcon from '@material-ui/icons/Add';
import ReactSelect, { OptionType } from '../components/ReactSelect';
import Auth from '../auth/Auth';
import { related, hasRelated, slug, remoteId, remoteIdGuid } from '../utils';
import UserMenu from '../components/UserMenu';
import OrganizationTable from '../components/OrganizationTable';
import GroupTabs from '../components/GroupTabs';
import PlanTable from '../components/PlanTable';
import PlanTabs from '../components/PlanTabs';
import ProjectSettings from '../components/ProjectSettings';
import MediaTab from '../components/MediaTab';
import GroupSettings from '../components/GroupSettings';
import Visualize from '../components/Visualize';
import Confirm from '../components/AlertDialog';
import logo from './transcriber10.png';
import { API_CONFIG } from '../api-variable';
const version = require('../../package.json').version;
const buildDate = require('../buildDate.json').date;

const drawerWidth = 240;

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
        width: drawerWidth,
        flexShrink: 0,
      },
    },
    help: {
      color: 'white',
    },
    header: {
      display: 'flex',
      flexDirection: 'row',
      paddingRight: theme.spacing(1.5),
    },
    appBar: {
      marginLeft: drawerWidth,
      [theme.breakpoints.up('sm')]: {
        width: `calc(100% - ${drawerWidth}px)`,
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
      width: drawerWidth,
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
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
    foot: {
      display: 'flex',
      flexDirection: 'column',
    },
    version: {
      paddingTop: theme.spacing(2),
      alignSelf: 'center',
    },
  })
);

interface componentType {
  [key: string]: JSX.Element | string;
}

interface IStateProps {
  t: IMainStrings;
  orbitLoaded: boolean;
}

interface IDispatchProps {}

interface IRecordProps {
  organizations: Array<Organization>;
  projects: Array<Project>;
  plans: Array<Plan>;
  groups: Array<Group>;
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
    groups,
    orbitLoaded,
  } = props;
  const classes = useStyles();
  const theme = useTheme();
  const [keyMap] = useGlobal('keyMap');
  const [user] = useGlobal('user');
  const [organization, setOrganization] = useGlobal('organization');
  const [group, setGroup] = useGlobal('group');
  const [project, setProject] = useGlobal('project');
  const [plan, setPlan] = useGlobal('plan');
  const [tab, setTab] = useGlobal('tab');
  const [choice, setChoice] = useState('');
  const [content, setContent] = useState('');
  const [orgOptions, setOrgOptions] = useState(Array<OptionType>());
  const [curOrg, setCurOrg] = useState(0);
  const [orgAvatar, setOrgAvatar] = useState<string>('');
  const [projOptions, setProjOptions] = useState(Array<OptionType>());
  const [curProj, setCurProj] = useState<number | null>(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [addProject, setAddProject] = useState(false);
  const [title, setTitle] = useState(t.silTranscriberAdmin);
  const [view, setView] = useState('');
  const [changed, setChanged] = useState(false);
  const saveConfirm = useRef<() => any>();
  const [alertOpen, setAlertOpen] = useState(false);

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
    setOrganization(value);
    setAddProject(false);
    setChoice('');
    setContent('');
    setGroup('');
  };

  const handleCommitProj = (value: string) => {
    localStorage.removeItem('url');
    setAddProject(false);
    setProject(value);
    setContent('');
    setChoice('');
    setGroup('');
    setTitle(t.projectSummary);
  };

  const handlePlanType = (value: string) => {
    if (value.toLocaleLowerCase() === 'scripture') {
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
    setChoice(slug(t.settings));
  };

  const handleUserMenuAction = (what: string) => {
    localStorage.removeItem('url');
    if (!/Close/i.test(what)) {
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
    setOrgOptions(orgOpts);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [organizations, organization, user]);

  useEffect(() => {
    if (orgOptions.length === 0) return;
    const cur = orgOptions.map(oo => oo.value).indexOf(organization);
    if (cur !== -1) {
      setCurOrg(cur);
      if (organizations[cur]) {
        const attr = organizations[cur].attributes;
        setOrgAvatar(attr ? attr.logoUrl : '');
      }
    } else {
      setCurOrg(0);
      const orgId = orgOptions[0].value;
      setOrganization(orgId);
      const org = organizations.filter(o => o.id === orgId);
      if (org.length > 0) {
        const attr = org[0].attributes;
        setOrgAvatar(attr ? attr.logoUrl : '');
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [orgOptions, organization]);

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
  }, [projects, organization]);

  useEffect(() => {
    const projKeys = projOptions.map(o => o.value);
    if (projKeys.length === 0) return;
    const cur = projKeys.indexOf(project);
    if (addProject) {
      setCurProj(null);
    } else if (projKeys.length === 0) {
      setCurProj(null);
      setContent('none');
      setTitle(t.silTranscriberAdmin);
    } else if (cur === -1) {
      setCurProj(0);
      setProject(projKeys[0]);
      setTitle(t.projectSummary);
      setContent('');
    } else {
      setCurProj(cur);
      setTitle(t.projectSummary);
      setContent('');
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [projOptions, project, addProject]);

  useEffect(() => {
    const curPlan = plans.filter(p => p.id === plan);
    if (curPlan.length > 0) {
      const attr = curPlan[0].attributes;
      setTitle(attr ? attr.name : '');
    }
  }, [plan, plans]);

  useEffect(() => {
    if (!groups || groups.length === 0) return;
    const curGroup = groups.filter(g => g.id === group);
    if (curGroup.length > 0) {
      const attr = curGroup[0].attributes;
      setTitle(attr ? attr.name : '');
      setContent('group');
    } else if (content === 'group') {
      setTitle(t.usersAndGroups);
      setContent(slug(t.usersAndGroups));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [group, groups]);

  useEffect(() => {
    if (!organization || !project || !choice) return;
    const orgId = remoteId('organization', organization, keyMap);
    const projId = remoteId('project', project, keyMap);
    if (orgId !== undefined && projId !== undefined) {
      if (choice === slug(t.usersAndGroups)) {
        const groupId = remoteId('group', group, keyMap);
        const groupPart = groupId ? '/' + groupId : '';
        history.push(
          '/main/' +
            orgId +
            '/' +
            slug(choice) +
            '/' +
            projId +
            '/' +
            tab.toString() +
            groupPart
        );
        setPlan('');
      } else if (choice !== slug(t.plans) || !plan) {
        history.push('/main/' + orgId + '/' + slug(choice) + '/' + projId);
        if (choice !== slug(t.media)) {
          setPlan('');
        }
        setTab(0);
      } else {
        const planId = remoteId('plan', plan, keyMap);
        history.push(
          '/main/' +
            orgId +
            '/' +
            slug(content) +
            '/' +
            projId +
            '/' +
            planId +
            '/' +
            tab.toString()
        );
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [project, organization, choice, content, plan, group, tab]);

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
    const orgId = remoteIdGuid('organization', parts[base + 1], keyMap);
    if (parts.length > base + 1 && organization !== orgId) {
      setOrganization(orgId);
    }
    let urlChoice = '';
    if (parts.length > base + 2 && content !== parts[base + 2]) {
      const value = slug(parts[base + 2]);
      urlChoice =
        ['scripture-plan', 'other-plan'].indexOf(value) !== -1
          ? slug(t.plans)
          : value;
      setChoice(urlChoice);
      setContent(value);
    }
    const projId = remoteIdGuid('project', parts[base + 3], keyMap);
    if (parts.length > base + 3 && project !== projId) {
      setProject(projId);
    }
    if (urlChoice === slug(t.plans)) {
      const planId = remoteIdGuid('plan', parts[base + 4], keyMap);
      if (parts.length > base + 4 && plan !== planId) {
        setPlan(planId);
      }
      if (parts.length > base + 5 && tab.toString() !== parts[base + 5]) {
        setTab(parseInt(parts[base + 5]));
      }
    } else if (urlChoice === slug(t.usersAndGroups)) {
      if (parts.length > base + 4 && tab.toString() !== parts[base + 4]) {
        setTab(parseInt(parts[base + 4]));
      }
      const groupId = remoteIdGuid('group', parts[base + 5], keyMap);
      if (parts.length > base + 5 && group !== groupId) {
        setGroup(groupId);
      }
    }
  }

  const transcriberIcons = [<PlanIcon />, <TeamIcon />, <MediaIcon />];

  const drawer = (
    <div>
      <div className={classes.toolbar}>
        <div className={classes.organization}>
          <div className={classes.avatar}>
            <Avatar src={orgAvatar} />
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
      <Divider />
      <List>
        {[t.organization, t.usersAndGroups].map((text, index) => (
          <ListItem
            button
            key={text}
            selected={slug(text) === choice}
            onClick={checkSavedEv(() => handleChoice(text))}
          >
            <ListItemIcon>
              {index % 2 === 0 ? <OrganizationIcon /> : <GroupIcon />}
            </ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <div className={classes.project}>
        <div className={classes.header}>
          <Typography variant="h6">{t.project}</Typography>
          <div className={classes.grow}>{'\u00A0'}</div>
          <IconButton size="small" onClick={handleAddProject}>
            <AddIcon />
          </IconButton>
        </div>
        {projOptions.length > 0 ? (
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
        ) : (
          ''
        )}
      </div>
      {curProj !== null ? (
        <div>
          <List>
            {[t.plans, t.team, t.media].map((text, index) => (
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
      ) : (
        ''
      )}
      <div className={classes.foot}>
        <div className={classes.version}>
          {version}
          <br />
          {buildDate}
        </div>
      </div>
    </div>
  );

  if (!orbitLoaded) return <Redirect to="/loading" />;

  let components: componentType = {};
  components[slug(t.organization)] = <OrganizationTable {...props} />;
  components[slug(t.usersAndGroups)] = <GroupTabs {...props} />;
  components[slug(t.media)] = (
    <MediaTab
      {...props}
      projectplans={plans.filter(p => related(p, 'project') === project)}
    />
  );
  components[slug(t.plans)] = (
    <PlanTable {...props} displaySet={handlePlanType} />
  );
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
  components[slug(t.team)] = <GroupSettings {...props} userDetail={true} />;
  components[slug(t.settings)] = (
    <ProjectSettings
      {...props}
      noMargin={true}
      add={addProject}
      finishAdd={handleFinishAdd}
    />
  );
  components[slug(t.integrations)] = 'integrations';
  components['group'] = <GroupSettings {...props} />;
  components[''] = <Visualize {...props} />;
  components['none'] = <></>;

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
          <a href={API_CONFIG.help} target="_blank" rel="noopener noreferrer">
            <IconButton>
              <HelpIcon className={classes.help} />
            </IconButton>
          </a>
          <UserMenu
            action={(v: string) => checkSavedFn(() => handleUserMenuAction(v))}
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
      <main className={classes.content}>{components[content]}</main>
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
    </div>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
  orbitLoaded: state.orbit.loaded,
});

// const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
//   ...bindActionCreators({}, dispatch),
// });

const mapRecordsToProps = {
  organizations: (q: QueryBuilder) => q.findRecords('organization'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  plans: (q: QueryBuilder) => q.findRecords('plan'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
};

export default withData(mapRecordsToProps)(connect(mapStateToProps)(
  ResponsiveDrawer
) as any) as any;
