import React, { useState } from 'react';
import { useGlobal } from 'reactn';
import classNames from 'classnames';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { IState, Project, IProjectstatusStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import {
  createStyles,
  withStyles,
  WithStyles,
  Theme,
} from '@material-ui/core/styles';
import {
  Drawer,
  List,
  ListItem,
  Divider,
  IconButton,
  Typography,
} from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import SettingsIcon from '@material-ui/icons/SettingsTwoTone';
import TeamIcon from '@material-ui/icons/GroupWorkTwoTone';
import SetIcon from '@material-ui/icons/WidgetsTwoTone';
import TaskIcon from '@material-ui/icons/ListTwoTone';
import MediaIcon from '@material-ui/icons/AudiotrackTwoTone';
import IntegrationIcon from '@material-ui/icons/UnarchiveTwoTone';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import TranscriberBar from '../components/TranscriberBar';
import Chart from '../components/Chart';
import ProjectSettings from '../components/ProjectSettings';
import BookTable from '../components/PlanTable';
import SetTable from '../components/SetTable';
import PlanTabs from '../components/PlanTabs';
import Auth from '../auth/Auth';

const drawerWidth = 240;

const styles = (theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    appBar: {
      zIndex: theme.zIndex.drawer + 1,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
    appBarShift: {
      marginLeft: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
      whiteSpace: 'nowrap',
    },
    drawerOpen: {
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    drawerClose: {
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      overflowX: 'hidden',
      width: theme.spacing(7) + 1,
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9) + 1,
      },
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 8px',
      ...theme.mixins.toolbar,
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
    dialogHeader: {},
  });

interface IStateProps {
  t: IProjectstatusStrings;
}

interface IRecordProps {
  projects: Array<Project>;
}

interface IProps extends IStateProps, IRecordProps, WithStyles<typeof styles> {
  theme: Theme;
  history: any;
  auth: Auth;
}

export function ProjectStatus(props: IProps) {
  const { classes, history, theme, projects, auth, t } = props;
  const { isAuthenticated } = auth;
  const [open, setOpen] = useState(true);
  const [project] = useGlobal('project');
  const currentProject = projects.filter((p: Project) => p.id === project)[0];
  const [view, setView] = useState('');
  const [content, setContent] = useState('chart');

  const handleDrawerClose = () => {
    setOpen(false);
  };
  const handleProjectItem = (e: any) => {
    setContent(e.target.innerText);
  };
  const handleCancel = () => {
    setView('/project');
  };
  const handleSet = (type: string) => {
    setContent(type);
  };

  if (!isAuthenticated()) return <Redirect to="/" />;

  const optionList = [
    t.settings,
    t.team,
    t.projectPlans,
    t.passages,
    t.media,
    t.integrations,
  ];

  const contentJsx =
    content.toLowerCase() === t.settings.toLowerCase() ||
    history.location.search === '?add' ? (
      <ProjectSettings {...props} />
    ) : content.toLowerCase() === t.projectPlans.toLowerCase() ? (
      <BookTable {...props} displaySet={handleSet} />
    ) : content === 'scripture' ? (
      <PlanTabs {...props} />
    ) : content === 'textbook' ? (
      <SetTable {...props} />
    ) : (
      //default
      <Chart {...props} />
    );

  if (view !== '') return <Redirect to={view} />;

  return (
    <div className={classes.root}>
      <TranscriberBar
        {...props}
        appFixed={true}
        close={handleCancel}
        appClass={classNames(classes.appBar, {
          [classes.appBarShift]: false,
        })}
      />
      <Drawer
        variant="permanent"
        className={classNames(classes.drawer, {
          [classes.drawerOpen]: open,
          [classes.drawerClose]: !open,
        })}
        classes={{
          paper: classNames({
            [classes.drawerOpen]: open,
            [classes.drawerClose]: !open,
          }),
        }}
        open={open}
      >
        <div className={classes.toolbar}>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? (
              <ChevronRightIcon />
            ) : (
              <ChevronLeftIcon />
            )}
          </IconButton>
        </div>
        <Divider />
        <List>
          {optionList.map((text, index) => (
            <ListItem button key={text} onClick={handleProjectItem}>
              <ListItemIcon>
                {index === 0 ? (
                  <SettingsIcon />
                ) : index === 1 ? (
                  <TeamIcon />
                ) : index === 2 ? (
                  <SetIcon />
                ) : index === 3 ? (
                  <TaskIcon />
                ) : index === 4 ? (
                  <MediaIcon />
                ) : (
                  <IntegrationIcon />
                )}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <main className={classes.content}>
        <div className={classes.toolbar} />
        <Typography variant="h4" className={classes.dialogHeader}>
          {(currentProject && currentProject.attributes.name) || t.newProject}
        </Typography>

        {contentJsx}
      </main>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'projectstatus' }),
});

const mapRecordsToProps = {
  projects: (q: QueryBuilder) => q.findRecords('project'),
};

export default withStyles(styles, { withTheme: true })(withData(
  mapRecordsToProps
)(connect(mapStateToProps)(ProjectStatus) as any) as any) as any;
