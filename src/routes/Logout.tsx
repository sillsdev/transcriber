import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as action from '../store';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Auth from '../auth/Auth';
import { Redirect } from 'react-router-dom';
import { localeDefault } from '../utils';
import { useGlobal } from 'reactn';
import { useLogout } from '../utils/useLogout';
const version = require('../../package.json').version;
const buildDate = require('../buildDate.json').date;

const useStyles = makeStyles({
  root: {
    width: '100%',
  },
  grow: {
    flexGrow: 1,
  },
  appBar: {
    display: 'flex',
    flexDirection: 'row',
    boxShadow: 'none',
  },
  version: {
    alignSelf: 'center',
  },
});

interface IDispatchProps {
  fetchLocalization: typeof action.fetchLocalization;
  setLanguage: typeof action.setLanguage;
}

interface IProps extends IDispatchProps {
  auth: Auth;
}

export function Logout(props: IProps) {
  const { auth } = props;
  const classes = useStyles();
  const { fetchLocalization, setLanguage } = props;
  const [isDeveloper] = useGlobal('developer');
  const [view, setView] = React.useState('');
  const doLogout = useLogout(auth, setView);

  useEffect(() => {
    setLanguage(localeDefault(isDeveloper));
    fetchLocalization();
    doLogout();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  if (/online|offline/i.test(view)) return <Redirect to={`/access/${view}`} />;

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

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchLocalization: action.fetchLocalization,
      setLanguage: action.setLanguage,
    },
    dispatch
  ),
});

export default connect(null, mapDispatchToProps)(Logout) as any;
