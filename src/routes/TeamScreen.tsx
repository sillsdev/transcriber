import React from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { makeStyles } from '@material-ui/core';
import { AppHead } from '../components/App/AppHead';
import { TeamProvider } from '../context/TeamContext';
import { TeamActions, TeamProjects } from '../components/Team';
import Auth from '../auth/Auth';

const useStyles = makeStyles({
  root: {
    width: '100%',
  },
  teamScreen: {
    display: 'flex',
    paddingTop: '80px',
  },
});

interface IProps {
  auth: Auth;
  history: {
    action: string;
    location: {
      hash: string;
      pathname: string;
    };
  };
}

export const TeamScreen = (props: IProps) => {
  const classes = useStyles();
  const [isDeveloper] = useGlobal('developer');

  if (!isDeveloper) return <Redirect to="/main" />;

  return (
    <div className={classes.root}>
      <AppHead {...props} />
      <TeamProvider {...props}>
        <div id="TeamScreen" className={classes.teamScreen}>
          <TeamActions />
          <TeamProjects />
        </div>
      </TeamProvider>
    </div>
  );
};

export default TeamScreen;
