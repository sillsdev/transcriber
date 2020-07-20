import React from 'react';
import { Button } from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core';

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

const t = {
  addTeam: 'Add a Team',
};

export const TeamActions = () => {
  const classes = useStyles();

  const handleAdd = () => {
    console.log('clicked', t.addTeam);
  };

  return (
    <div className={classes.root}>
      <Button variant="contained" onClick={handleAdd}>
        {t.addTeam}
      </Button>
    </div>
  );
};
