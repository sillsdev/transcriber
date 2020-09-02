import React from 'react';
import clsx from 'clsx';
import { useGlobal } from 'reactn';
import { useParams } from 'react-router-dom';
import { StickyRedirect } from '../control';
import { IState, IMainStrings } from '../model';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { AppHead } from '../components/App/AppHead';
import { TranscriberProvider } from '../context/TranscriberContext';
import { TaskItemWidth } from '../components/TaskTable';
import { TranscribeSwitch } from '../components/App/TranscribeSwitch';
import TaskTable from '../components/TaskTable';
import Transcriber from '../components/Transcriber';
import { UnsavedContext } from '../context/UnsavedContext';
import Confirm from '../components/AlertDialog';
import { useRole, useUrlContext } from '../crud';
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

interface IStateProps {
  t: IMainStrings;
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
});

interface IProps extends IStateProps {
  auth: Auth;
}

export const WorkScreen = connect(mapStateToProps)((props: IProps) => {
  const { auth, t } = props;
  const classes = useStyles();
  const { prjId } = useParams();
  const [project] = useGlobal('project');
  const [organization] = useGlobal('organization');
  const setUrlContext = useUrlContext();
  const [projRole] = useGlobal('projRole');
  const [topFilter, setTopFilter] = React.useState(false);
  const { setMyProjRole } = useRole();
  const [alertOpen] = useGlobal('alertOpen');
  const uctx = React.useContext(UnsavedContext);
  const { checkSavedFn, handleSaveConfirmed, handleSaveRefused } = uctx.state;
  const [view, setView] = React.useState('');

  const handleSwitchTo = () => {
    setView('admin');
  };

  const SwitchTo = () => {
    if (projRole !== 'admin') return <></>;
    return (
      <TranscribeSwitch
        label={t.admin}
        switchTo={() => checkSavedFn(handleSwitchTo)}
        t={t}
      />
    );
  };

  const handleTopFilter = (top: boolean) => setTopFilter(top);

  React.useEffect(() => {
    const projectId = setUrlContext(prjId);
    if (projRole === '') setMyProjRole(projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    setUrlContext(prjId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prjId]);

  if (project === '' && organization !== '')
    return <StickyRedirect to="/team" />;
  if (view === 'admin') return <StickyRedirect to={`/plan/${prjId}/0`} />;

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
      {alertOpen && (
        <Confirm
          title={t.UnsavedData}
          text={t.saveFirst}
          yesResponse={handleSaveConfirmed}
          noResponse={handleSaveRefused}
        />
      )}
    </div>
  );
});

export default WorkScreen;
