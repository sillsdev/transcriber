import React, { useState } from 'react';
import { connect } from 'react-redux';
import { IState, IEmailUnverifiedStrings } from '../model';
import localStrings from '../selector/localize';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { Typography, Grid, Button } from '@material-ui/core';
import { Redirect } from 'react-router';
import { API_CONFIG } from '../api-variable';
import Axios from 'axios';
import Auth from '../auth/Auth';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fullScreen: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      width: '100%',
      height: `calc(100vh - 120px)`,
    },
    list: {
      alignSelf: 'center',
    },
    button: {
      margin: theme.spacing(1),
      variant: 'outlined',
      color: 'primary',
    },
    actions: theme.mixins.gutters({
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
    }) as any,
  })
);

interface IStateProps {
  t: IEmailUnverifiedStrings;
}

interface IProps extends IStateProps {
  auth: Auth;
}

export const EmailUnverified = (props: IProps) => {
  const { auth, t } = props;
  const classes = useStyles();
  const [view, setView] = useState('');
  const [message, setMessage] = useState('');

  const handleResend = (e: any) => {
    var url = API_CONFIG.host + '/api/auth/resend';
    Axios.get(url, {
      headers: {
        Authorization: 'Bearer ' + auth.accessToken,
      },
    })
      .then((response) => setMessage('resent'))
      .catch((err) => {
        setMessage('resend err' + err.toString());
      });
  };

  const handleLogout = (e: any) => {
    setView('Logout');
  };

  if (/Logout/i.test(view)) return <Redirect to="/logout" />;

  return (
    <div className={classes.fullScreen}>
      <Typography align="center" variant="h6">
        {t.emailUnverified}
        <br></br>
        {t.verify}
      </Typography>
      <Typography align="center" variant="h6">
        {message}
      </Typography>
      <Grid
        container
        direction="column"
        justify="space-around"
        alignItems="center"
        spacing={0}
      >
        <div className={classes.actions}>
          <Button
            variant="contained"
            color="primary"
            className={classes.button}
            onClick={handleResend}
          >
            {t.resend}
          </Button>
        </div>
        <div className={classes.actions}>
          <Button
            variant="contained"
            color="primary"
            className={classes.button}
            onClick={handleLogout}
          >
            {t.verified}
          </Button>
        </div>
      </Grid>
    </div>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'emailUnverified' }),
});

export default connect(mapStateToProps)(EmailUnverified) as any;
