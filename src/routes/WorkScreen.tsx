import React from 'react';
import clsx from 'clsx';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
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
import Auth from '../auth/Auth';
import { remoteIdGuid } from '../utils';

const DrawerMin = 0;
const DrawerTask = 0;
const HeadHeight = 64;

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
      left: theme.spacing(DrawerMin) + 1,
      [theme.breakpoints.up('sm')]: {
        left: theme.spacing(DrawerTask) + 1,
      },
      backgroundColor: 'white',
    },
    topTranscriber: {
      zIndex: 1,
      position: 'absolute',
      left: theme.spacing(DrawerMin) + TaskItemWidth + theme.spacing(0.5),
      [theme.breakpoints.up('sm')]: {
        left: theme.spacing(DrawerTask) + TaskItemWidth + theme.spacing(0.5),
      },
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
  history: {
    action: string;
    location: {
      hash: string;
      pathname: string;
    };
  };
}

export const WorkScreen = connect(mapStateToProps)((props: IProps) => {
  const { auth, history, t } = props;
  const { pathname } = history?.location;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [isDeveloper] = useGlobal('developer');
  const [project] = useGlobal('project');
  const [projRole] = useGlobal('projRole');
  const [topFilter, setTopFilter] = React.useState(false);
  const [view, setView] = React.useState('');

  const handleSwitchTo = () => {
    setView('admin');
  };

  const SwitchTo = () => {
    if (projRole !== 'admin') return <></>;
    return <TranscribeSwitch label={t.admin} switchTo={handleSwitchTo} t={t} />;
  };

  const handleTopFilter = (top: boolean) => setTopFilter(top);

  const selected = (url: string) => {
    const part = url.split('/');
    if (part.length > 2 && /[0-9]+/.test(part[2]))
      return remoteIdGuid('passage', part[2], memory.keyMap);
    return '';
  };

  if (!isDeveloper) return <Redirect to="/main" />;
  if (project === '') return <Redirect to="/team" />;
  if (view === 'admin') return <Redirect to="/plan" />;

  return (
    <div className={classes.root}>
      <AppHead {...props} SwitchTo={SwitchTo} />
      <TranscriberProvider {...props} select={selected(pathname)}>
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
});

export default WorkScreen;
