import React from 'react';
import clsx from 'clsx';
import { useGlobal } from 'reactn';
import { useLocation, useParams } from 'react-router-dom';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
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
import Auth from '../auth/Auth';
import { HeadHeight } from '../App';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
    },
    teamScreen: {
      display: 'flex',
      paddingTop: '80px',
    },
    panel2: {
      display: 'flex',
      flexDirection: 'row',
      paddingTop: `${HeadHeight}px`,
    },
    topFilter: {
      zIndex: 2,
      position: 'absolute',
      left: 0,
      backgroundColor: 'white',
    },
    topTranscriber: {
      zIndex: 1,
      position: 'absolute',
      left: TaskItemWidth + theme.spacing(0.5),
    },
  })
);

interface IProps {
  auth: Auth;
}
interface ParamTypes {
  prjId: string;
}
export const WorkScreen = (props: IProps) => {
  const { auth } = props;
  const classes = useStyles();
  const { pathname } = useLocation();
  const { prjId } = useParams<ParamTypes>();
  const [project] = useGlobal('project');
  const [organization] = useGlobal('organization');
  const setUrlContext = useUrlContext();
  const [projRole] = useGlobal('projRole');
  const [projType] = useGlobal('projType');
  const [memory] = useGlobal('memory');
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
    //if (projRole !== 'admin') return <></>;
    return (
      <ViewMode
        mode={ViewOption.Transcribe}
        onMode={() => checkSavedFn(handleSwitchTo)}
      />
    );
  };

  const handleTopFilter = (top: boolean) => setTopFilter(top);

  React.useEffect(() => {
    const projectId = setUrlContext(prjId);
    if (projRole === '')
      if (setMyProjRole(projectId) === '') {
        // If after proj role set there is none, force reload
        localStorage.removeItem(localUserKey(LocalKey.url, memory));
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
    <div className={classes.root}>
      <AppHead {...props} SwitchTo={SwitchTo} />
      <TranscriberProvider {...props}>
        <div className={classes.panel2}>
          <div className={clsx({ [classes.topFilter]: topFilter })}>
            <TaskTable auth={auth} onFilter={handleTopFilter} />
          </div>
          {!topFilter && (
            <div className={classes.topTranscriber}>
              <Transcriber auth={auth} />
            </div>
          )}
        </div>
      </TranscriberProvider>
    </div>
  );
};

export default WorkScreen;
