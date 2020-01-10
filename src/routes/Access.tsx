import React, { useEffect, useRef } from 'react';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState, IAccessStrings } from '../model';
import localStrings from '../selector/localize';
import * as action from '../store';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { AppBar, Toolbar, Typography } from '@material-ui/core';
import Auth from '../auth/Auth';
import { AUTH_CONFIG } from '../auth/auth0-variables';
import { API_CONFIG } from '../api-variable';
import { Online } from '../utils';
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
    container: {
      display: 'flex',
      justifyContent: 'center',
    },
    appBar: theme.mixins.gutters({
      display: 'flex',
      flexDirection: 'row',
      boxShadow: 'none',
    }),
    version: {
      alignSelf: 'center',
    },
    actions: theme.mixins.gutters({
      paddingTop: 16,
      paddingBottom: 16,
      marginTop: theme.spacing(3),
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
    }),
  })
);

interface IStateProps {
  t: IAccessStrings;
}

interface IDispatchProps {
  fetchLocalization: typeof action.fetchLocalization;
  setLanguage: typeof action.setLanguage;
}

interface IProps extends IStateProps, IDispatchProps {
  history: any;
  auth: Auth;
}

export function Access(props: IProps) {
  const { auth, t } = props;
  const classes = useStyles();
  const { fetchLocalization, setLanguage } = props;
  const nonce = 'test';
  const accessRef = useRef<any>(null);

  useEffect(() => {
    if (navigator.language.split('-')[0]) {
      setLanguage(navigator.language.split('-')[0]);
    }
    fetchLocalization();
    const localAuth = localStorage.getItem('trAdminAuthResult');
    if (localAuth) {
      try {
        auth.setSession(JSON.parse(localAuth));
      } catch (error) {
        localStorage.removeItem('trAdminAuthResult');
      }
    }
    if (!auth.isAuthenticated()) {
      localStorage.removeItem('trAdminAuthResult');
      if (Online() && !API_CONFIG.offline) {
        // accessRef.current.click();
        auth.login();
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  if (auth.isAuthenticated()) return <Redirect to="/loading" />;

  const callback = AUTH_CONFIG.callbackUrl
    .replace('/callback', '')
    .replace('https://', '');

  return (
    <div className={classes.root}>
      <AppBar className={classes.appBar} position="static" color="inherit">
        <Toolbar>
          <Typography variant="h6" color="inherit" className={classes.grow}>
            {t.silTranscriberAccess}
          </Typography>
        </Toolbar>
        <div className={classes.grow}>{'\u00A0'}</div>
        <div className={classes.version}>
          {version}
          <br />
          {buildDate}
        </div>
      </AppBar>
      <div className={classes.container}>
        <div className={classes.actions}>
          {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
          <a
            ref={accessRef}
            href={
              AUTH_CONFIG.loginApp +
              '/?clientid=' +
              AUTH_CONFIG.clientId +
              '&callback=' +
              callback +
              '&nonce=' +
              nonce +
              '&state=tAdInit'
            }
          ></a>
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'access' }),
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchLocalization: action.fetchLocalization,
      setLanguage: action.setLanguage,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Access) as any;
