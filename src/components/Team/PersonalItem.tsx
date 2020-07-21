import React from 'react';
import { Grid, Paper, Typography } from '@material-ui/core';
import PersonIcon from '@material-ui/icons/Person';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { TeamContext } from '../../context/TeamContext';
import { ProjectCard, AddCard } from '.';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      backgroundColor: theme.palette.background.default,
      marginBottom: theme.spacing(2),
    },
    teamHead: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: theme.spacing(2),
    },
    name: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      paddingRight: theme.spacing(1),
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
    <Paper id="PersonalItem" className={classes.root}>
      <div className={classes.teamHead}>
        <Typography variant="h5" className={classes.name}>
          <PersonIcon className={classes.icon} />
          {t.personalProjects}
        </Typography>
      </div>
      <Grid container className={classes.cardFlow}>
        {personalProjects().map((i) => {
          return <ProjectCard key={i.id} project={i} />;
        })}
        <AddCard team={null} />
      </Grid>
    </Paper>
  );
};
