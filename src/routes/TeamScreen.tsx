import { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobal } from 'reactn';
import { LocalKey, localUserKey } from '../utils';
import { Box } from '@mui/material';
import AppHead from '../components/App/AppHead';
import { TeamProvider } from '../context/TeamContext';
import { TeamProjects } from '../components/Team';
import StickyRedirect from '../components/StickyRedirect';
import { remoteId } from '../crud';
import TeamActions from '../components/Team/TeamActions';
import { UnsavedContext } from '../context/UnsavedContext';

export const TeamScreen = () => {
  const { pathname } = useLocation();
  const [isOffline] = useGlobal('offline');
  const [project, setProject] = useGlobal('project');
  const [projRole, setProjRole] = useGlobal('projRole');
  const [projType, setProjType] = useGlobal('projType');
  const [memory] = useGlobal('memory');
  const [plan] = useGlobal('plan');
  const [view, setView] = useState('');
  const { clearChanged } = useContext(UnsavedContext).state;

  useEffect(() => {
    clearChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (project !== '' && projRole) {
      const remProjId = remoteId('plan', plan, memory.keyMap);
      const loc = `/plan/${remProjId || plan}/0`;
      if (loc !== localStorage.getItem(localUserKey(LocalKey.url))) {
        setView(loc);
      } else {
        localStorage.setItem(localUserKey(LocalKey.url), '/team');
        if (project !== '') setProject('');
        if (projRole) setProjRole(undefined);
        if (projType !== '') setProjType('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, projRole, isOffline, plan]);

  if (view !== '' && view !== pathname) {
    return <StickyRedirect to={view} />;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <AppHead />
      <TeamProvider>
        <Box id="TeamScreen" sx={{ display: 'flex', paddingTop: '80px' }}>
          <TeamActions />
          <TeamProjects />
        </Box>
      </TeamProvider>
    </Box>
  );
};

export default TeamScreen;
