import React from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { AddTeamDialog } from '.';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
      minWidth: theme.spacing(20),
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center',
    },
  })
);

export const TeamActions = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <AddTeamDialog />
    </div>
  );
};
