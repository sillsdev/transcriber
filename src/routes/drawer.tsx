import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
// import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { IState, IMainStrings, Organization, Project, Plan } from '../model';
// import * as actions from '../actions';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { KeyMap, QueryBuilder } from '@orbit/data';
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
import PassageIcon from '@material-ui/icons/ListTwoTone';
import MediaIcon from '@material-ui/icons/AudiotrackTwoTone';
import IntegrationIcon from '@material-ui/icons/PowerTwoTone';
import MenuIcon from '@material-ui/icons/Menu';
import AddIcon from '@material-ui/icons/Add';
import ReactSelect, { OptionType } from '../components/ReactSelect';
import Auth from '../auth/Auth';
import { related, slug } from '../utils';
import OrganizationTable from '../components/OrganizationTable';
import UserTable from '../components/UserTable';
import PlanTable from '../components/PlanTable';
import PlanTabs from '../components/PlanTabs';
import ProjectSettings from '../components/ProjectSettings';
import MediaTab from '../components/MediaTab';
import Chart from '../components/Chart';
import logo from './transcriber10.png';

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
}

interface IProps extends IStateProps, IDispatchProps, IRecordProps {
  auth: Auth;
  history: {
    location: {
      hash: string;
      pathname: string;
    };
    push: (path: string) => void;
  };
}

export function ResponsiveDrawer(props: IProps) {
  const { t, history, organizations, projects, plans, orbitLoaded } = props;
  const classes = useStyles();
  const theme = useTheme();
  const [keyMap] = useGlobal<KeyMap>('keyMap');
  const [initials] = useGlobal<string>('initials');
  const [organization, setOrganization] = useGlobal<string>('organization');
  const [orgOptions, setOrgOptions] = useState(Array<OptionType>());
  const [curOrg, setCurOrg] = useState(0);
  const [orgAvatar, setOrgAvatar] = useState<string>('');
  const [project, setProject] = useGlobal<string>('project');
  const [projOptions, setProjOptions] = useState(Array<OptionType>());
  const [curProj, setCurProj] = useState<number | null>(0);
  const [plan] = useGlobal<string>('plan');
  const [tab] = useGlobal<string>('tab');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [choice, setChoice] = useState('');
  const [content, setContent] = useState('');
  const [addProject, setAddProject] = useState(false);
  const [title, setTitle] = useState(t.silTranscriberAdmin);
  const [planName, setPlanName] = useState('');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleChoice = (choice: string) => () => {
    setAddProject(false);
    setChoice(slug(choice));
    setContent(slug(choice));
    setTitle(choice);
  };

  const handleCommitOrg = (value: string) => {
    setOrganization(value);
  };

  const handleCommitProj = (value: string) => {
    setAddProject(false);
    setProject(value);
    setContent('');
    setChoice('');
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
    setAddProject(true);
    setProject('');
    setContent(slug(t.settings));
    setTitle(t.addProject);
  };

  const handleFinishAdd = () => {
    setAddProject(false);
    setChoice(slug(t.settings));
  };

  // useEffect(() => {
  //   localStorage.setItem('url', history.location.pathname);
  //   const parts = history.location.hash.split('#');
  //   const base = 0;
  //   const orgId = keyMap.keyToId('organization', 'remoteId', parts[base + 1]);
  //   if (parts.length > base + 1 && organization !== orgId) {
  //     setGlobal({ ...globals, organization: orgId });
  //   }
  //   if (parts.length > base + 2) {
  //     setChoice(slug(parts[base + 2]));
  //   }
  //   if (parts.length > base + 3) {
  //     const id = keyMap.keyToId('project', 'remoteId', parts[base + 3]);
  //     setGlobal({ ...globals, project: id });
  //   }
  //   if (parts.length > base + 4) {
  //     const id = keyMap.keyToId('plan', 'remoteId', parts[base + 4]);
  //     setGlobal({ ...globals, plan: id });
  //   }
  //   if (parts.length > base + 5) {
  //     setGlobal({ ...globals, tab: slug(parts[base + 5]) });
  //   }
  // }, [history, globals, keyMap]);

  useEffect(() => {
    const orgOpts = organizations
      .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1))
      .map((o: Organization) => {
        return {
          value: o.id,
          label: o.attributes.name,
        };
      });
    setOrgOptions(orgOpts);
    const curOrg = organizations.map(o => o.id).indexOf(organization);
    if (curOrg !== -1) {
      setCurOrg(curOrg);
      setOrgAvatar(organizations[curOrg].attributes.logoUrl);
    } else if (organizations.length > 0) {
      setCurOrg(0);
      setOrganization(organizations[0].id);
      setOrgAvatar(organizations[0].attributes.logoUrl);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [organizations, organization]);

  useEffect(() => {
    const projOpts = projects
      .filter(p => related(p, 'organization') === organization)
      .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1))
      .map(p => {
        return {
          value: p.id,
          label: p.attributes.name,
        };
      });
    setProjOptions(projOpts);
    const projKeys = projOpts.map(o => o.value);
    const newCurProj = projKeys.indexOf(project);
    if (addProject || projKeys.length < 1) {
      setCurProj(null);
    } else if (newCurProj === -1) {
      setCurProj(0);
      setProject(projKeys[0]);
      setTitle(t.projectSummary);
    } else {
      setCurProj(newCurProj);
      setTitle(t.projectSummary);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [projects, project, organization, addProject]);

  useEffect(() => {
    const curPlan = plans.filter(p => p.id === plan);
    if (curPlan.length > 0) {
      setPlanName(curPlan[0].attributes.name);
    }
  }, [plan, plans]);

  useEffect(() => {
    const orgId = keyMap.idToKey('organization', 'remoteId', organization);
    const projId = keyMap.idToKey('project', 'remoteId', project);
    if (orgId !== undefined && projId !== undefined) {
      if (choice !== slug(t.plans) || !plan) {
        history.push('/main/' + orgId + '/' + slug(choice) + '/' + projId);
      } else {
        const planId = keyMap.idToKey('plan', 'remoteId', plan);
        history.push(
          '/main/' +
            orgId +
            '/' +
            slug(choice) +
            '/' +
            projId +
            '/' +
            planId +
            '/' +
            tab
        );
        setTitle(planName);
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [project, organization, choice, plan, tab]);

  const transcriberIcons = [
    <PassageIcon />,
    <MediaIcon />,
    <PlanIcon />,
    <TeamIcon />,
  ];

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
              onCommit={handleCommitOrg}
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
            onClick={handleChoice(text)}
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
                onCommit={handleCommitProj}
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
            {[t.passages, t.media, t.plans, t.team].map((text, index) => (
              <ListItem
                button
                key={text}
                selected={slug(text) === choice}
                onClick={handleChoice(text)}
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
                onClick={handleChoice(text)}
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
    </div>
  );

  if (!orbitLoaded) return <Redirect to="/loading" />;

  let components: componentType = {};
  components[slug(t.organization)] = <OrganizationTable {...props} />;
  components[slug(t.usersAndGroups)] = <UserTable {...props} />;
  components[slug(t.passages)] = 'passages';
  components[slug(t.media)] = <MediaTab {...props} />;
  components[slug(t.plans)] = (
    <PlanTable {...props} displaySet={handlePlanType} />
  );
  components['scripture-plan'] = <PlanTabs {...props} />;
  components['other-plan'] = <PlanTabs {...props} bookCol={-1} />;
  components[slug(t.team)] = 'team';
  components[slug(t.settings)] = (
    <ProjectSettings
      {...props}
      noMargin={true}
      add={addProject}
      finishAdd={handleFinishAdd}
    />
  );
  components[slug(t.integrations)] = 'integrations';
  components[''] = <Chart {...props} />;

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
          <Avatar>{initials}</Avatar>
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
};

export default withData(mapRecordsToProps)(connect(mapStateToProps)(
  ResponsiveDrawer
) as any) as any;
