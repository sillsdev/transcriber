import React from 'react';
import { Grid, Typography } from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { TeamContext } from '../../context/TeamContext';
import { ProjectCard, AddCard } from '.';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    teamHead: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: theme.spacing(2),
    },
    cardFlow: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
    },
  })
);

const t = {
  personalProjects: 'Personal Projects',
};

export const PersonalItem = () => {
  const classes = useStyles();
  const ctx = React.useContext(TeamContext);
  const { personalProjects } = ctx.state;

  return (
    <div id="PersonalItem" className={classes.root}>
      <div className={classes.teamHead}>
        <Typography variant="h5">{t.personalProjects}</Typography>
      </div>
      <Grid container className={classes.cardFlow}>
        {personalProjects().map((i) => {
          return <ProjectCard key={i.id} project={i} />;
        })}
        <AddCard team={null} />
      </Grid>
    </div>
  );
};
