import React from 'react';
import { useGlobal } from 'reactn';
import { useParams, useLocation } from 'react-router-dom';
import { makeStyles } from '@material-ui/core';
import AppHead from '../components/App/AppHead';
import { PlanProvider } from '../context/PlanContext';
import ViewMode, { ViewOption } from '../control/ViewMode';
import PlanTabs from '../components/PlanTabs';
import { useUrlContext, useRole, useProjectType } from '../crud';
import { forceLogin, localUserKey, LocalKey } from '../utils';
import Auth from '../auth/Auth';
import { UnsavedContext } from '../context/UnsavedContext';
import StickyRedirect from '../components/StickyRedirect';

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

interface ParamTypes {
  prjId: string;
}
export const PlanScreen = (props: IProps) => {
  const classes = useStyles();
  const { pathname } = useLocation();
  const { prjId } = useParams<ParamTypes>();
  const setUrlContext = useUrlContext();
  const uctx = React.useContext(UnsavedContext);
  const { checkSavedFn } = uctx.state;
  const [projRole] = useGlobal('projRole');
  const { setMyProjRole } = useRole();
  const [projType] = useGlobal('projType');
  const { setProjectType } = useProjectType();
  const [project] = useGlobal('project');
  const [organization] = useGlobal('organization');
  const [view, setView] = React.useState('');

  const handleSwitchTo = () => {
    setView(`/work/${prjId}`);
  };

  const SwitchTo = () => {
    return (
      <ViewMode
        mode={ViewOption.AudioProject}
        onMode={(mode: ViewOption) =>
          mode === ViewOption.Transcribe && checkSavedFn(handleSwitchTo)
        }
      />
    );
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, organization]);

  if (view !== '' && view !== pathname) return <StickyRedirect to={view} />;

  return (
    <div className={classes.root}>
      <AppHead {...props} SwitchTo={SwitchTo} />
      <PlanProvider {...props}>
        <div id="PlanScreen" className={classes.teamScreen}>
          <PlanTabs {...props} checkSaved={checkSavedFn} />
        </div>
      </PlanProvider>
    </div>
  );
};

export default PlanScreen;
