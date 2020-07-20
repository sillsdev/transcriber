import React from 'react';
import { Grid, Typography, Button } from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { Organization } from '../../model';
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
  members: 'Members ({0})',
  settings: 'Settings',
};

interface IProps {
  team: Organization;
}

export const TeamItem = (props: IProps) => {
  const { team } = props;
  const classes = useStyles();
  const ctx = React.useContext(TeamContext);
  const { teamProjects, teamMembers } = ctx.state;

  const handleMembers = (team: Organization) => () => {
    console.log(`clicked ${t.members} of ${team?.attributes?.name}`);
  };

  const handleSettings = (team: Organization) => () => {
    console.log(`clicked ${t.settings} for ${team?.attributes?.name}`);
  };

  return (
    <div id="TeamItem" className={classes.root}>
      <div className={classes.teamHead}>
        <Typography variant="h5">{team?.attributes?.name}</Typography>
        <div>
          <Button variant="contained" onClick={handleMembers(team)}>
            {t.members.replace('{0}', teamMembers(team.id).toString())}
          </Button>
          {' \u00A0'}
          <Button variant="contained" onClick={handleSettings(team)}>
            {t.settings}
          </Button>
        </div>
      </div>
      <Grid container className={classes.cardFlow}>
        {teamProjects(team.id).map((i) => {
          return <ProjectCard key={i.id} project={i} />;
        })}
        <AddCard team={team} />
      </Grid>
    </div>
  );
};
