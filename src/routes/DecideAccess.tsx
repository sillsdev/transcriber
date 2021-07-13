import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState, IAccessStrings } from '../model';
import localStrings from '../selector/localize';
import * as action from '../store';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Typography, Button, Paper, FormLabel, Box } from '@material-ui/core';
import Auth from '../auth/Auth';
import { Online, localeDefault } from '../utils';
import { isElectron } from '../api-variable';
import AppHead from '../components/App/AppHead';
import OfflineIcon from '@material-ui/icons/CloudOff';
import OnlineIcon from '@material-ui/icons/CloudQueue';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'block',
      width: '100%',
    },
    container: {
      display: 'block',
      justifyContent: 'center',
    },
    paper: {
      padding: theme.spacing(3),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      widith: '80%',
    },
    sectionHead: {
      fontSize: '16pt',
      paddingTop: theme.spacing(4),
      paddingBottom: theme.spacing(2),
    },
    button: {
      margin: theme.spacing(3),
      minWidth: theme.spacing(20),
    },
    icon: {
      marginRight: theme.spacing(1),
    },
    iconlabel: {
      marginBottom: '5px',
      marginTop: '8px',
    },
    col: {
      display: 'flex',
      flexDirection: 'column',
    },
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
  auth: Auth;
}

export function DecideAccess(props: IProps) {
  const { auth, t } = props;
  const classes = useStyles();
  const { fetchLocalization, setLanguage } = props;
  const [isDeveloper] = useGlobal('developer');
  const [, setConnected] = useGlobal('connected');
  const [whichUsers, setWhichUsers] = useState<string | null>(null);

  useEffect(() => {
    setLanguage(localeDefault(isDeveloper));
    fetchLocalization();
    Online((connected) => {
      setConnected(connected);
    }, auth);
    const choice = localStorage.getItem('offlineAdmin');
    if (choice !== null)
      setWhichUsers(choice === 'true' ? 'offline' : 'online');
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const handleGoOnline = () => {
    handleOfflineChange('online');
  };

  const handleGoOffline = () => {
    handleOfflineChange('offline');
  };
  const handleOfflineChange = (target: string) => {
    console.log(target);
    setWhichUsers(target);
    localStorage.setItem(
      'offlineAdmin',
      target === 'offline' ? 'true' : 'false'
    );
  };

  if (!isElectron || whichUsers !== null) {
    return <Redirect to={'/access/' + whichUsers} />;
  }
  return (
    <div className={classes.root}>
      <AppHead {...props} />
      {isElectron && (
        <div className={classes.container}>
          <Typography className={classes.sectionHead}>Filler</Typography>
          <Paper className={classes.paper}>
            <Box display="flex">
              <Box>
                <OnlineIcon className={classes.icon} />
                <br />
                <OnlineIcon /> <OfflineIcon className={classes.icon} />
              </Box>
              <Box className={classes.col}>
                <FormLabel className={classes.iconlabel}>
                  {t.onlineAdminDesc}
                </FormLabel>
                <FormLabel className={classes.iconlabel}>
                  {t.onlineWorkDesc}
                </FormLabel>
              </Box>
            </Box>
            <Button
              id="accessLogin"
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={handleGoOnline}
            >
              {t.onlineAdmin}
            </Button>
            <FormLabel>
              <OfflineIcon className={classes.icon} /> {t.offlineAdminDesc}
              <br />
              <OfflineIcon className={classes.icon} /> {t.offlineWorkDesc}
            </FormLabel>
            <Button
              id="accessLogin"
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={handleGoOffline}
            >
              {t.offlineAdmin}
            </Button>
          </Paper>
        </div>
      )}
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DecideAccess) as any;
