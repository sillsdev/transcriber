import React from 'react';
import { useGlobal } from 'reactn';
import { StickyRedirect } from '../control';
import { makeStyles } from '@material-ui/core';
import { AppHead } from '../components/App/AppHead';
import { TeamProvider } from '../context/TeamContext';
import { TeamProjects } from '../components/Team';
import Auth from '../auth/Auth';
import { remoteId } from '../crud';
import { isElectron } from '../api-variable';
import TeamActions from '../components/Team/TeamActions';

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
}

export const TeamScreen = (props: IProps) => {
  const classes = useStyles();
  const [project] = useGlobal('project');
  const [projRole] = useGlobal('projRole');
  const [memory] = useGlobal('memory');
  const [plan] = useGlobal('plan');

  if (project !== '' && projRole !== '') {
    const remProjId = remoteId('plan', plan, memory.keyMap);
    return (
      <StickyRedirect
        to={
          projRole === 'admin' && !isElectron
            ? `/plan/${remProjId}/0`
            : `/work/${remProjId}`
        }
      />
    );
  }

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
