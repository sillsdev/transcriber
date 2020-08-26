import React from 'react';
import { useGlobal } from 'reactn';
import { useParams } from 'react-router-dom';
import { StickyRedirect } from '../control';
import { IState, IMainStrings } from '../model';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import { makeStyles } from '@material-ui/core';
import { AppHead } from '../components/App/AppHead';
import { PlanProvider, PlanContext } from '../context/PlanContext';
import { TranscribeSwitch } from '../components/App/TranscribeSwitch';
import PlanTabs from '../components/PlanTabs';
import Confirm from '../components/AlertDialog';
import SnackBar from '../components/SnackBar';
import { useUrlContext } from '../crud';
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

interface IStateProps {
  t: IMainStrings;
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
});

interface IProps extends IStateProps {
  auth: Auth;
}

const PlanBase = (props: IProps) => {
  const classes = useStyles();
  const [alertOpen] = useGlobal('alertOpen');
  const ctx = React.useContext(PlanContext);
  const {
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
        {...props}
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

export const PlanScreen = connect(mapStateToProps)((props: IProps) => {
  const { t } = props;
  const classes = useStyles();
  const { prjId } = useParams();
  const setUrlContext = useUrlContext();
  const [project] = useGlobal('project');
  const [organization] = useGlobal('organization');
  const [view, setView] = React.useState('');

  const handleSwitchTo = () => {
    setView('transcribe');
  };

  const SwitchTo = () => {
    return <TranscribeSwitch switchTo={handleSwitchTo} t={t} />;
  };

  React.useEffect(() => {
    setUrlContext(prjId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prjId]);

  if (project === '' && organization !== '')
    return <StickyRedirect to="/team" />;
  if (view === 'transcribe') return <StickyRedirect to={`/work/${prjId}`} />;

  return (
    <div className={classes.root}>
      <AppHead {...props} SwitchTo={SwitchTo} />
      <PlanProvider {...props}>
        <PlanBase {...props} />
      </PlanProvider>
    </div>
  );
});

export default PlanScreen;
