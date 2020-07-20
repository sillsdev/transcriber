import React from 'react';
import { Grid } from '@material-ui/core';
import { TeamContext } from '../../context/TeamContext';
import { PersonalItem, TeamItem } from '.';

export const TeamProjects = () => {
  const ctx = React.useContext(TeamContext);

  return (
    <Grid container>
      <PersonalItem key={1} />
      {ctx.state.teams().map((i) => {
        return <TeamItem key={i.id} team={i} />;
      })}
    </Grid>
  );
};
