import { useState, useEffect, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { LocalKey, localUserKey, useHome } from '../utils';
import { Box, Grid } from '@mui/material';
import AppHead from '../components/App/AppHead';
import { TeamProvider } from '../context/TeamContext';
import { TeamProjects } from '../components/Team';
import StickyRedirect from '../components/StickyRedirect';
import { findRecord, related, remoteId } from '../crud';
import TeamActions from '../components/Team/TeamActions';
import { UnsavedContext } from '../context/UnsavedContext';
import { RecordKeyMap } from '@orbit/records';
import { PlanD } from '../model';

export const TeamScreen = () => {
  const { pathname } = useLocation();
  const [isOffline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const [project, setProject] = useGlobal('project'); //verified this is not used in a function 2/18/25
  const [projType] = useGlobal('projType'); //verified this is not used in a function 2/18/25
  const [memory] = useGlobal('memory');
  const [plan] = useGlobal('plan'); //verified this is not used in a function 2/18/25
  const [home, setHome] = useGlobal('home'); //verified this is not used in a function 2/18/25
  const [view, setView] = useState('');
  const { startClear } = useContext(UnsavedContext).state;
  const { resetProject } = useHome();
  const loaded = useRef(false);

  useEffect(() => {
    startClear();
    setHome(true);
    loaded.current = true;
    return () => {
      loaded.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loaded.current) {
      let selectedPlan = localStorage.getItem('selected-plan');
      let selectedProject = project;
      if (selectedPlan) {
        if (!selectedProject) {
          const planRec = findRecord(memory, 'plan', selectedPlan) as PlanD;
          selectedProject = related(planRec, 'project') as string;
          setProject(selectedProject);
        }
      } else {
        selectedPlan = plan;
      }
      if (selectedProject !== '' && selectedPlan && !home) {
        const remProjId = remoteId(
          'plan',
          selectedPlan,
          memory?.keyMap as RecordKeyMap
        );
        const loc = `/plan/${remProjId || selectedPlan}/0`;
        if (loc !== localStorage.getItem(localUserKey(LocalKey.url))) {
          setView(loc);
        } else {
          localStorage.setItem(localUserKey(LocalKey.url), '/team');
          resetProject();
        }
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
        <Grid
          container
          id="TeamScreen"
          sx={{ display: 'flex', paddingTop: '80px' }}
        >
          <Grid item xs={6} md={3} lg={2}>
            <TeamActions />
          </Grid>
          <Grid item xs={12} md={9} lg={10}>
            <TeamProjects />
          </Grid>
        </Grid>
      </TeamProvider>
    </Box>
  );
};

export default TeamScreen;
