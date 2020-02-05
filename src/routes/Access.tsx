import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState, IAccessStrings, User } from '../model';
import localStrings from '../selector/localize';
import * as action from '../store';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import Auth from '../auth/Auth';
import { API_CONFIG } from '../api-variable';
import { Online } from '../utils';
import { TransformBuilder, QueryBuilder } from '@orbit/data';
import { UserAvatar } from '../components/UserAvatar';
import SnackBar from '../components/SnackBar';
const version = require('../../package.json').version;
const buildDate = require('../buildDate.json').date;

const isElectron = process.env.REACT_APP_MODE === 'electron';

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
    }) as any,
    version: {
      alignSelf: 'center',
    },
    paper: theme.mixins.gutters({
      paddingTop: 16,
      paddingBottom: 16,
      marginTop: theme.spacing(3),
      width: '40%',
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center',
      [theme.breakpoints.down('md')]: {
        width: '100%',
      },
    }) as any,
    dialogHeader: theme.mixins.gutters({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
    }) as any,
    actions: theme.mixins.gutters({
      paddingTop: 16,
      paddingBottom: 16,
      marginTop: theme.spacing(2),
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
    }) as any,
    button: {
      marginRight: theme.spacing(1),
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
  history: any;
  auth: Auth;
}

export function Access(props: IProps) {
  const { auth, t } = props;
  const classes = useStyles();
  const { fetchLocalization, setLanguage } = props;
  const [memory] = useGlobal('memory');
  const [schema] = useGlobal('schema');
  const [users, setUsers] = useState(Array<User>());
  const [message, setMessage] = useState(<></>);

  const handleLogin = () => auth.login();

  const handleImport = () => setMessage(<span>Import PTF</span>);

  const handleSelect = (uId: string) => () => {
    const selected = users.filter(u => u.id === uId);
    if (selected.length > 0)
      setMessage(<span>{selected[0].attributes.name} selected</span>);
  };

  const handleResetMessage = () => setMessage(<></>);

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
      if (Online() && !API_CONFIG.offline && !isElectron) {
        handleLogin();
      }
    }
    if (isElectron) {
      const curUsers = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('user')
      ) as User[];
      console.log(curUsers);
      if (curUsers.length === 0) {
        const u1: User = {
          type: 'user',
          attributes: {
            name: 'Sara Hentzel',
            avatarUrl: null,
          },
        } as any;
        schema.initializeRecord(u1);
        const u2: User = {
          type: 'user',
          attributes: {
            name: 'Greg Trihus',
            avatarUrl: null,
          },
        } as any;
        schema.initializeRecord(u2);
        const u3: User = {
          type: 'user',
          attributes: {
            name: 'Dale McCrory',
            avatarUrl: null,
          },
        } as any;
        schema.initializeRecord(u3);
        memory
          .update((t: TransformBuilder) => [
            t.addRecord(u1),
            t.addRecord(u2),
            t.addRecord(u3),
          ])
          .then(() => {
            setUsers(
              memory.cache.query((q: QueryBuilder) =>
                q.findRecords('user')
              ) as User[]
            );
          });
      } else setUsers(curUsers);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  if (auth.isAuthenticated() && !isElectron) return <Redirect to="/loading" />;

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
      {isElectron && (
        <div className={classes.container}>
          <Paper className={classes.paper}>
            <Typography variant="body1" className={classes.dialogHeader}>
              {t.accessSilTranscriber}
            </Typography>
            <Grid container direction="row">
              {users.length > 0 && (
                <Grid item xs={12} md={6}>
                  <List>
                    {users
                      .sort((i, j) =>
                        i.attributes.name < j.attributes.name ? -1 : 1
                      )
                      .map(u => (
                        <ListItem key={u.id} onClick={handleSelect(u.id)}>
                          <ListItemIcon>
                            <UserAvatar {...props} users={users} userRec={u} />
                          </ListItemIcon>
                          <ListItemText primary={u.attributes.name} />
                        </ListItem>
                      ))}
                  </List>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <div className={classes.actions}>
                  <Button
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={handleLogin}
                    disabled={!Online()}
                  >
                    {t.login}
                  </Button>
                </div>
                <div className={classes.actions}>
                  <Button
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={handleImport}
                  >
                    {t.importProject}
                  </Button>
                </div>
              </Grid>
            </Grid>
          </Paper>
          <SnackBar message={message} reset={handleResetMessage} />
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

export default connect(mapStateToProps, mapDispatchToProps)(Access) as any;
