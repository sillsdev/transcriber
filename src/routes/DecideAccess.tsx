import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState, IAccessStrings } from '../model';
import localStrings from '../selector/localize';
import * as action from '../store';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Typography,
  Button,
  Paper,
  Radio,
  RadioGroup,
  Box,
  FormLabel,
} from '@material-ui/core';
import Auth from '../auth/Auth';
import { Online, localeDefault } from '../utils';
import { IAxiosStatus } from '../store/AxiosStatus';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../mods/react-orbitjs';
import { isElectron } from '../api-variable';
import { useSnackBar } from '../hoc/SnackBar';
import AppHead from '../components/App/AppHead';
import OfflineIcon from '@material-ui/icons/CloudOff';
import OnlineIcon from '@material-ui/icons/CloudQueue';
import Access from './Access';

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
      transform: 'translateZ(0px)',
      widith: '80%',
    },
    sectionHead: {
      fontSize: '16pt',
      paddingTop: theme.spacing(4),
      paddingBottom: theme.spacing(2),
    },
    actions: {
      paddingTop: theme.spacing(2),
    },
    button: {
      margin: theme.spacing(3),
      minWidth: theme.spacing(20),
    },
    formControl: {
      margin: theme.spacing(3),
    },
    box: {
      display: 'block',
      justifyContent: 'center',
      padding: theme.spacing(3),
      border: 1,
    },
  })
);

interface IStateProps {
  t: IAccessStrings;
  importStatus: IAxiosStatus | undefined;
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
  const { showMessage } = useSnackBar();
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
  console.log('DecideAccess', whichUsers);
  if (whichUsers !== null) {
    return <Redirect to={'/access/' + whichUsers} />;
  }
  return (
    <div className={classes.root}>
      <AppHead {...props} />
      {isElectron && (
        <div className={classes.container}>
          <Typography className={classes.sectionHead}>Filler 1</Typography>{' '}
          <Paper className={classes.paper}>
            <FormLabel>
              <OnlineIcon />
              &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Project Admin is online.
              <br />
              <OnlineIcon /> <OfflineIcon />
              &nbsp; Transcription can be done online or offline.&nbsp;
            </FormLabel>
            <Button
              id="accessLogin"
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={handleGoOnline}
            >
              {'online'}
            </Button>
            <FormLabel>
              <OfflineIcon /> Project Admin is offline.&nbsp; <br />
              <OfflineIcon /> All work will always be done offline.&nbsp;
            </FormLabel>
            <Button
              id="accessLogin"
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={handleGoOffline}
            >
              {'always offline'}
            </Button>
          </Paper>
        </div>
      )}
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'access' }),
  importStatus: state.importexport.importexportStatus,
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
const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  plans: (q: QueryBuilder) => q.findRecords('plan'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(DecideAccess) as any
) as any;
