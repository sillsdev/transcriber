import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';
import { Link } from 'react-router-dom';
import { IState } from '../model/state'
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import InputBase from '@material-ui/core/InputBase';
import { fade } from '@material-ui/core/styles/colorManipulator';
import { createStyles, Theme, withStyles, WithStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import MediaCard from '../present/MediaCard';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    grow: {
      flexGrow: 1,
    },
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
    content: {
        display: 'flex',
        flexGrow: 1,
        justifyContent: "space-around",
        padding: theme.spacing.unit * 3,
    },
  });

export interface Props extends IStateProps, WithStyles<typeof styles> {}

function AdminPanel(props: Props) {
    const { classes, user } = props;

    if (!user || user === "") {
      return (<Redirect to="/login" />)
    }
  
    return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Typography className={classes.title} variant="h6" color="inherit" noWrap>
            Transcriber Admin
          </Typography>
          <div className={classes.grow} />
          <div className={classes.search}>
            <div className={classes.searchIcon}>
              <SearchIcon />
            </div>
            <InputBase
              placeholder="Search…"
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput,
              }}
            />
          </div>
        </Toolbar>
      </AppBar>
      <div className={classes.content}>
        <MediaCard type="Users" explain="Add or manage users"/>
        <MediaCard type="Projects" explain="Add or manage projects"/>
        <MediaCard type="Media" explain="Add or manage audio files"/>
        <MediaCard type="Organizations" explain="Add or manage organizations"/>
        <MediaCard type="Set Templates" explain="Add or manage task templates"/>
        <Link to="/task">
          <MediaCard type="Task" explain="Link to Lambda API"/>
        </Link>
      </div>
    </div>
  );
}

AdminPanel.propTypes = {
  classes: PropTypes.object.isRequired,
} as any;

interface IStateProps {
    user: string;
  }
  
  const mapStateToProps = (state: IState) => ({
    user: state.user.email,
  });
  
  
export default withStyles(styles)(connect(mapStateToProps)(AdminPanel));
