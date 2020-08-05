import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState } from '../model';
import * as action from '../store';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Auth from '../auth/Auth';
import { isElectron } from '../api-variable';
import { Redirect } from 'react-router-dom';
import { localeDefault } from '../utils';
const version = require('../../package.json').version;
const buildDate = require('../buildDate.json').date;

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

interface IStateProps {}

interface IDispatchProps {
  fetchLocalization: typeof action.fetchLocalization;
  setLanguage: typeof action.setLanguage;
}

interface IProps extends IStateProps, IDispatchProps {
  history: any;
  auth: Auth;
}

export function Logout(props: IProps) {
  const { auth } = props;
  const classes = useStyles();
  const { fetchLocalization, setLanguage } = props;
  const [view, setView] = React.useState('');

  useEffect(() => {
    setLanguage(localeDefault());
    fetchLocalization();
    if (!isElectron) {
      auth.logout();
    } else {
      localStorage.removeItem('user-id');
      setView('Access');
    }
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
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchLocalization: action.fetchLocalization,
      setLanguage: action.setLanguage,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Logout) as any;
