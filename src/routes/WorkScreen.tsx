import React from 'react';
import { useGlobal } from 'reactn';
import { useLocation, useParams } from 'react-router-dom';
import AppHead from '../components/App/AppHead';
import { TranscriberProvider } from '../context/TranscriberContext';
import { TaskItemWidth } from '../components/TaskTable';
import ViewMode, { ViewOption } from '../control/ViewMode';
import TaskTable from '../components/TaskTable';
import Transcriber from '../components/Transcriber';
import StickyRedirect from '../components/StickyRedirect';
import { UnsavedContext } from '../context/UnsavedContext';
import { useProjectType, useRole, useUrlContext } from '../crud';
import { forceLogin, localUserKey, LocalKey } from '../utils';
import { HeadHeight } from '../App';
import { Box, BoxProps, styled } from '@mui/material';

// see: https://mui.com/material-ui/customization/how-to-customize/
interface TaskTableBoxProps extends BoxProps {
  topFilter?: boolean;
}
const TaskTableBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'topFilter',
})<TaskTableBoxProps>(({ topFilter }) => ({
  ...(topFilter && {
    zIndex: 2,
    position: 'absolute',
    left: 0,
    backgroundColor: 'white',
  }),
}));

const TranscriberBox = styled(Box)<BoxProps>(({ theme }) => ({
  zIndex: 1,
  position: 'absolute',
  left: `${TaskItemWidth + 4}px`,
}));

interface ParamTypes {
  prjId: string;
}
export const WorkScreen = () => {
  const { pathname } = useLocation();
  const { prjId } = useParams<ParamTypes>();
  const [project] = useGlobal('project');
  const [organization] = useGlobal('organization');
  const setUrlContext = useUrlContext();
  const [projRole] = useGlobal('projRole');
  const [projType] = useGlobal('projType');
  const { setProjectType } = useProjectType();
  const [topFilter, setTopFilter] = React.useState(false);
  const { setMyProjRole } = useRole();
  const uctx = React.useContext(UnsavedContext);
  const { checkSavedFn } = uctx.state;
  const [view, setView] = React.useState('');

  const handleSwitchTo = () => {
    setView(`/plan/${prjId}/0`);
  };

  const SwitchTo = () => {
    return (
      <ViewMode
        mode={ViewOption.Transcribe}
        onMode={(mode: ViewOption) =>
          mode === ViewOption.AudioProject && checkSavedFn(handleSwitchTo)
        }
      />
    );
  };

  const handleTopFilter = (top: boolean) => setTopFilter(top);

  React.useEffect(() => {
    const projectId = setUrlContext(prjId);
    if (!projRole)
      if (!setMyProjRole(projectId)) {
        // If after proj role set there is none, force reload
        localStorage.removeItem(localUserKey(LocalKey.url));
        forceLogin();
        setView('/logout');
      }
    if (projType === '') setProjectType(projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    setUrlContext(prjId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prjId]);

  React.useEffect(() => {
    if (project === '' && organization !== '') setView('/team');
  }, [project, organization]);

  if (view !== '' && view !== pathname) return <StickyRedirect to={view} />;

  return (
    <Box sx={{ width: '100%' }}>
      <AppHead SwitchTo={SwitchTo} />
      <TranscriberProvider>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            paddingTop: `${HeadHeight}px`,
          }}
        >
          <TaskTableBox topFilter={topFilter}>
            <TaskTable onFilter={handleTopFilter} />
          </TaskTableBox>
          {!topFilter && (
            <TranscriberBox>
              <Transcriber />
            </TranscriberBox>
          )}
        </Box>
      </TranscriberProvider>
    </Box>
  );
};

export default WorkScreen;
