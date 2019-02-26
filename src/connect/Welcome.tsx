import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';
import { IState } from '../model/state'
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import { createStyles, Theme, withStyles, WithStyles } from '@material-ui/core/styles';
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
    content: {
        display: 'flex',
        flexGrow: 1,
        padding: theme.spacing.unit * 3,
    },
    message: {
        ...theme.mixins.gutters(),
        paddingTop: theme.spacing.unit * 2,
        paddingBottom: theme.spacing.unit * 2,
        paddingLeft: theme.spacing.unit * 2,
        paddingRight: theme.spacing.unit * 2,
        marginLeft: theme.spacing.unit * 4,
        marginRight: theme.spacing.unit * 4,
        display: 'flex',
        flexDirection: 'column',
    },
    button: {
      margin: theme.spacing.unit,
    },
    buttonRow: {
      alignSelf: "center",
    },
    text: {
      paddingTop: theme.spacing.unit * 2,
      textAlign: "center",
    }
  });

export interface Props extends IStateProps, WithStyles<typeof styles> {}

function Welcome(props: Props) {
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
        </Toolbar>
      </AppBar>
      <div className={classes.content}>
        <MediaCard type="Users" explain="Add or manage users"/>
        <Paper className={classes.message} elevation={1}>
            <Typography variant="h4" color="inherit" className={classes.text}>
                Thanks for signing up!
            </Typography>
            <Typography variant="h5" color="inherit" className={classes.text}>
                Do you want to start transcribing immediately?
            </Typography>
            <div className={classes.buttonRow}>
              <Button variant="contained" className={classes.button}>
                Transcriber Web
              </Button>
              <Button variant="contained" className={classes.button}>
                Transcriber Desktop
              </Button>
            </div>
            <Typography variant="h5" color="inherit" className={classes.text}>
                Do you want to configure a transcription project?
            </Typography>
            <div className={classes.buttonRow}>
              <Link to="/admin">
                <Button variant="contained" className={classes.button}>
                    Transcriber Admin
                </Button>
              </Link>
            </div>
        </Paper>
      </div>
    </div>
  );
}

Welcome.propTypes = {
  classes: PropTypes.object.isRequired,
} as any;

interface IStateProps {
  user: string;
}

const mapStateToProps = (state: IState) => ({
  user: state.user.email,
});


export default withStyles(styles)(connect(mapStateToProps)(Welcome));