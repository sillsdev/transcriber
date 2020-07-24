import React from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { makeStyles } from '@material-ui/core';
import { AppHead } from '../components/App/AppHead';
import { PlanProvider, PlanContext } from '../context/PlanContext';
import { TranscribeSwitch } from '../components/App/TranscribeSwitch';
import PlanTabs from '../components/PlanTabs';
import Confirm from '../components/AlertDialog';
import SnackBar from '../components/SnackBar';
import Auth from '../auth/Auth';

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
  history: {
    action: string;
    location: {
      hash: string;
      pathname: string;
    };
  };
}

const PlanBase = (props: IProps) => {
  const classes = useStyles();
  const [alertOpen] = useGlobal('alertOpen');
  const ctx = React.useContext(PlanContext);
  const {
    changeTab,
    checkSavedFn,
    t,
    handleSaveConfirmed,
    handleSaveRefused,
    message,
    handleMessageReset,
    isScripture,
  } = ctx.state;

  return (
    <div id="PlanScreen" className={classes.teamScreen}>
      <PlanTabs
        changeTab={changeTab}
        checkSaved={checkSavedFn}
        bookCol={isScripture() ? 0 : -1}
      />
      {alertOpen && (
        <Confirm
          title={t.UnsavedData}
          text={t.saveFirst}
          yesResponse={handleSaveConfirmed}
          noResponse={handleSaveRefused}
        />
      )}
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
};

export const PlanScreen = (props: IProps) => {
  const classes = useStyles();
  const [isDeveloper] = useGlobal('developer');
  const [project] = useGlobal('project');
  const [view, setView] = React.useState('');

  const handleSwitchTo = () => {
    setView('transcribe');
  };

  const SwitchTo = () => {
    return <TranscribeSwitch switchTo={handleSwitchTo} />;
  };

  if (!isDeveloper) return <Redirect to="/main" />;
  if (project === '') return <Redirect to="/team" />;
  if (view === 'transcribe') return <Redirect to="/work" />;

  return (
    <div className={classes.root}>
      <AppHead {...props} SwitchTo={SwitchTo} />
      <PlanProvider {...props}>
        <PlanBase {...props} />
      </PlanProvider>
    </div>
  );
};

export default PlanScreen;
