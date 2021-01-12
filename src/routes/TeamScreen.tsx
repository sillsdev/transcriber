import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobal } from 'reactn';
import { LocalKey, localUserKey } from '../utils';
import { makeStyles } from '@material-ui/core';
import AppHead from '../components/App/AppHead';
import { TeamProvider } from '../context/TeamContext';
import { TeamProjects } from '../components/Team';
import StickyRedirect from '../components/StickyRedirect';
import Auth from '../auth/Auth';
import { remoteId } from '../crud';
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
  const { auth } = props;
  const classes = useStyles();
  const { pathname } = useLocation();
  const [isOffline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [project, setProject] = useGlobal('project');
  const [projRole, setProjRole] = useGlobal('projRole');
  const [memory] = useGlobal('memory');
  const [plan] = useGlobal('plan');
  const [view, setView] = useState('');

  useEffect(() => {
    if (project !== '' && projRole !== '') {
      const remProjId = remoteId('plan', plan, memory.keyMap);
      const loc =
        projRole === 'admin' && (!isOffline || offlineOnly)
          ? `/plan/${remProjId || plan}/0`
          : `/work/${remProjId || plan}`;
      if (loc !== localStorage.getItem(localUserKey(LocalKey.url, memory))) {
        setView(loc);
      } else {
        localStorage.setItem(localUserKey(LocalKey.url, memory), '/team');
        if (project !== '') setProject('');
        if (projRole !== '') setProjRole('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, projRole, isOffline, plan]);

  if (view !== '' && view !== pathname) {
    return <StickyRedirect to={view} />;
  }

  return (
    <div className={classes.root}>
      <AppHead {...props} />
      <TeamProvider {...props}>
        <div id="TeamScreen" className={classes.teamScreen}>
          <TeamActions auth={auth} />
          <TeamProjects auth={auth} />
        </div>
      </TeamProvider>
    </div>
  );
};

export default TeamScreen;
