import React from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { Button } from '@material-ui/core';
import { DialogMode, Organization } from '../../model';
import { TeamDialog } from '.';
import { TeamContext } from '../../context/TeamContext';

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
  const [open, setOpen] = React.useState(false);
  const ctx = React.useContext(TeamContext);
  const { teamCreate, cardStrings } = ctx.state;
  const t = cardStrings;

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleAdd = (team: Organization) => {
    teamCreate(team);
  };

  return (
    <div className={classes.root}>
      <Button variant="contained" color="default" onClick={handleClickOpen}>
        {t.addTeam}
      </Button>
      <TeamDialog
        mode={DialogMode.add}
        isOpen={open}
        onOpen={setOpen}
        onCommit={handleAdd}
      />
    </div>
  );
};
