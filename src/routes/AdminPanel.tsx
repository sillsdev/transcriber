import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { IState, IAdminpanelStrings } from '../model';
import localStrings from '../selector/localize';
import Grid from '@material-ui/core/Grid';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles,
} from '@material-ui/core/styles';
import MediaCard from '../components/MediaCard';
import organizationSvg from '../assets/organization.svg';
import usersSvg from '../assets/users.svg';
import projectSvg from '../assets/project.svg';
import mediaSvg from '../assets/media.svg';
import bookSvg from '../assets/book.svg';
import Auth from '../auth/Auth';
import TranscriberBar from '../components/TranscriberBar';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    title: {
      display: 'none',
      [theme.breakpoints.up('sm')]: {
        display: 'block',
      },
    },
    grid: {
      paddingTop: theme.spacing(4),
      children: {
        spacing: '32px',
      },
    },
    link: {
      textDecoration: 'none',
    },
  });

interface IStateProps {
  t: IAdminpanelStrings;
}

interface IProps extends IStateProps, WithStyles<typeof styles> {
  auth: Auth;
}

function AdminPanel(props: IProps) {
  const { classes, auth, t } = props;
  const { isAuthenticated } = auth;

  if (!isAuthenticated()) return <Redirect to="/" />;

  return (
    <div className={classes.root}>
      <TranscriberBar {...props} />
      <Grid
        className={classes.grid}
        container
        direction="row"
        justify="center"
        alignItems="flex-start"
      >
        <Link to="/organization" className={classes.link}>
          <MediaCard
            type={t.organizations}
            explain={t.addManageOrganizations}
            graphic={organizationSvg}
          />
        </Link>
        <Link to="/user" className={classes.link}>
          <MediaCard
            type={t.users}
            explain={t.addManageUsers}
            graphic={usersSvg}
          />
        </Link>
        <Link to="/project" className={classes.link}>
          <MediaCard
            type={t.projects}
            explain={t.addManageProjects}
            graphic={projectSvg}
          />
        </Link>
        <Link to="/admin" className={classes.link}>
          <MediaCard
            type={t.media}
            explain={t.addManageAudioFiles}
            graphic={mediaSvg}
          />
        </Link>
        <Link to="/admin" className={classes.link}>
          <MediaCard
            type={t.plans}
            explain={t.addManagePlans}
            graphic={bookSvg}
          />
        </Link>
      </Grid>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'adminpanel' }),
});

export default withStyles(styles, { withTheme: true })(connect(mapStateToProps)(
  AdminPanel
) as any) as any;
