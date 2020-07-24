import React from 'react';
import { Grid } from '@material-ui/core';
import { TeamContext } from '../../context/TeamContext';
import { PersonalItem, TeamItem } from '.';
import SnackBar from '../SnackBar';

export const TeamProjects = () => {
  const ctx = React.useContext(TeamContext);
  const { teams, message, handleMessageReset } = ctx.state;

  return (
    <>
      <Grid container>
        <PersonalItem key={1} />
        {teams().map((i) => {
          return <TeamItem key={i.id} team={i} />;
        })}
      </Grid>
      <SnackBar message={message} reset={handleMessageReset} />
    </>
  );
};
