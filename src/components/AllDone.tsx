import React from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { Typography } from '@material-ui/core';
import success from '../assets/success.png';
import { TranscriberContext } from '../context/TranscriberContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center',
    },
    image: {
      width: '343px',
      alignSelf: 'center',
      padding: theme.spacing(3),
    },
  })
);

export const AllDone = () => {
  const classes = useStyles();
  const ctx = React.useContext(TranscriberContext);
  const { transcriberStr } = ctx.state;
  const t = transcriberStr;

  return (
    <div className={classes.root}>
      <img src={success} alt="Success!" className={classes.image} />
      <Typography variant="h1" align="center">
        {t.congratulation}
      </Typography>
      {'\u00A0'}
      <Typography variant="h5" align="center">
        {t.noMoreTasks}
      </Typography>
      {'\u00A0'}
    </div>
  );
};
