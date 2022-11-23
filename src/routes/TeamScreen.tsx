import { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobal } from 'reactn';
import { LocalKey, localUserKey, useHome } from '../utils';
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
  const [project] = useGlobal('project');
  const [projType] = useGlobal('projType');
  const [memory] = useGlobal('memory');
  const [plan] = useGlobal('plan');
  const [home, setHome] = useGlobal('home');
  const [view, setView] = useState('');
  const { clearChanged } = useContext(UnsavedContext).state;
  const { resetProject } = useHome();
  useEffect(() => {
    clearChanged();
    setHome(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (project !== '' && plan && !home) {
      const remProjId = remoteId('plan', plan, memory.keyMap);
      const loc = `/plan/${remProjId || plan}/0`;
      if (loc !== localStorage.getItem(localUserKey(LocalKey.url))) {
        setView(loc);
      } else {
        localStorage.setItem(localUserKey(LocalKey.url), '/team');
        resetProject();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, projType, isOffline, plan, home]);

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
