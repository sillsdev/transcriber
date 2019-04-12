import React from 'react';
import PropTypes from 'prop-types';
// import { Redirect } from 'react-router';
import { Link } from 'react-router-dom';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import InputBase from '@material-ui/core/InputBase';
import { fade } from '@material-ui/core/styles/colorManipulator';
import { createStyles, Theme, withStyles, WithStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import Avatar from '@material-ui/core/Avatar';
import MediaCard from './MediaCard';
import organizationSvg from './assets/organization.svg';
import usersSvg from './assets/users.svg';
import projectSvg from './assets/project.svg';
import mediaSvg from './assets/media.svg';
import bookSvg from './assets/book.svg';

export interface Props extends WithStyles<typeof styles> { }

function AdminPanel(props: Props) {
  const { classes } = props;

  return (
    <div className={classes.root}>
      <AppBar className={classes.appBar} position="static">
        <Toolbar>
          <Typography className={classes.title} variant="h6" color="inherit" noWrap>
            {'Transcriber Admin'}
          </Typography>
          <div className={classes.grow} />
          <div className={classes.search}>
            <div className={classes.searchIcon}>
              <SearchIcon />
            </div>
            <InputBase
              placeholder={'Search…'}
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput,
              }}
            />
          </div>
          <Avatar className={classes.avatar} />
        </Toolbar>
      </AppBar>
      <Grid className={classes.grid}
        container
        direction='row'
        justify='center'
        alignItems='flex-start' >
        <Link to='/organization' className={classes.link}>
          <MediaCard type={'Organizations'} explain={'Add or manage organizations'} graphic={organizationSvg} />
        </Link>
        <Link to='/user' className={classes.link}>
          <MediaCard type={'Users'} explain={'Add or manage users'} graphic={usersSvg} />
        </Link>
        <Link to='/project' className={classes.link}>
          <MediaCard type={'Projects'} explain={'Add or manage projects'} graphic={projectSvg} />
        </Link>
        <Link to='/admin' className={classes.link}>
          <MediaCard type={'Media'} explain={'Add or manage audio files'} graphic={mediaSvg} />
        </Link>
        <Link to='/admin' className={classes.link}>
          <MediaCard type={'Books'} explain={'Add or manage books'} graphic={bookSvg} />
        </Link>
      </Grid>
    </div>
  );
}

AdminPanel.propTypes = {
  classes: PropTypes.object.isRequired,
} as any;

const styles = (theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    grow: {
      flexGrow: 1,
    },
    appBar: theme.mixins.gutters({
      background: '#FFE599',
      color: 'black'
    }),
    title: {
      display: 'none',
      [theme.breakpoints.up('sm')]: {
        display: 'block',
      },
    },
    search: {
      position: 'relative',
      borderRadius: theme.shape.borderRadius,
      backgroundColor: fade(theme.palette.common.white, 0.15),
      '&:hover': {
        backgroundColor: fade(theme.palette.common.white, 0.25),
      },
      marginLeft: 0,
      width: '100%',
      [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing.unit,
        width: 'auto',
      },
    },
    searchIcon: {
      width: theme.spacing.unit * 9,
      height: '100%',
      position: 'absolute',
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputRoot: {
      color: 'inherit',
      width: '100%',
    },
    inputInput: {
      paddingTop: theme.spacing.unit,
      paddingRight: theme.spacing.unit,
      paddingBottom: theme.spacing.unit,
      paddingLeft: theme.spacing.unit * 10,
      transition: theme.transitions.create('width'),
      width: '100%',
      [theme.breakpoints.up('sm')]: {
        width: 120,
        '&:focus': {
          width: 200,
        },
      },
    },
    grid: {
      paddingTop: theme.spacing.unit * 4,
      children: {
        spacing: '32px'
      }
    },
    link: {
      textDecoration: 'none',
    },
    avatar: {
      marginLeft: theme.spacing.unit,
      marginRight: theme.spacing.unit,
    }
  });

export default withStyles(styles)(AdminPanel);
