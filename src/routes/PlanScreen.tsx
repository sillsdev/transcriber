import React from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useParams, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import AppHead from '../components/App/AppHead';
import { PlanProvider } from '../context/PlanContext';
import PlanTabs from '../components/PlanTabs';
import { useUrlContext, useProjectType } from '../crud';
import { UnsavedContext } from '../context/UnsavedContext';
import StickyRedirect from '../components/StickyRedirect';

export const PlanScreen = () => {
  const { pathname } = useLocation();
  const { prjId } = useParams();
  const setUrlContext = useUrlContext();
  const uctx = React.useContext(UnsavedContext);
  const { checkSavedFn } = uctx.state;
  const [projType] = useGlobal('projType');
  const { setProjectType } = useProjectType();
  const [project] = useGlobal('project');
  const [organization] = useGlobal('organization');
  const [user] = useGlobal('user');
  const [view, setView] = React.useState('');

  React.useEffect(() => {
    const projectId = setUrlContext(prjId ?? '');
    if (projType === '') setProjectType(projectId);
    if (user && !projType) {
      // If user is set but we don't have this project, go to the team screen
      setView('/team');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    setUrlContext(prjId ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prjId]);

  React.useEffect(() => {
    if (project === '' && organization !== '' && view !== '/team')
      setView('/team');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, organization]);

  if (view !== '' && view !== pathname) return <StickyRedirect to={view} />;

  return (
    <Box sx={{ width: '100%' }}>
      <AppHead switchTo={false} />
      <PlanProvider>
        <Box id="PlanScreen" sx={{ display: 'flex', paddingTop: '80px' }}>
          <PlanTabs checkSaved={checkSavedFn} />
        </Box>
      </PlanProvider>
    </Box>
  );
};

export default PlanScreen;
