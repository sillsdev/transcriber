import { useEffect, useState, useContext } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useGlobal } from 'reactn';
import { createStyles, IconButton, makeStyles, Theme } from '@material-ui/core';
import CompleteIcon from '@material-ui/icons/CheckBoxOutlined';
import NotCompleteIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { IPassageDetailStepCompleteStrings, IState } from '../../model';
import { LocalKey, localUserKey } from '../../utils';
import localStrings from '../../selector/localize';
import { connect } from 'react-redux';
import { getPasIdByNum } from '../../crud';
import { UnsavedContext } from '../../context/UnsavedContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    actionButton: {
      color: theme.palette.primary.light,
    },
    icon: {
      fontSize: '16px',
    },
  })
);
interface IStateProps {
  t: IPassageDetailStepCompleteStrings;
}

interface IProps extends IStateProps {}

export const PassageDetailStepComplete = (props: IProps) => {
  const { t } = props;
  const {
    currentstep,
    setCurrentStep,
    stepComplete,
    setStepComplete,
    orgWorkflowSteps,
    psgCompleted,
    prjId,
    section,
    passage,
  } = usePassageDetailContext();
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const { pathname } = useLocation();
  const { push } = useHistory();
  const [, setCurrentIndex] = useState(-1);
  const [complete, setComplete] = useState(false);
  const [view, setView] = useState('');
  const { startSave, waitForSave } = useContext(UnsavedContext).state;

  useEffect(() => {
    var curIndex = orgWorkflowSteps.findIndex((s) => s.id === currentstep);
    setCurrentIndex(curIndex);
    setComplete(stepComplete(currentstep));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentstep, orgWorkflowSteps, psgCompleted]);

  const handleToggleComplete = () => {
    setStepComplete(currentstep, !complete);
    setCurrentStep(''); // setting to empty jumps to first uncompleted step
    const seq = passage?.attributes?.sequencenum;
    const pasId = getPasIdByNum(section, seq + 1, memory);
    if (pasId) setView(`/detail/${prjId}/${pasId}`);
  };

  useEffect(() => {
    setTimeout(() => {
      if (view) {
        if (view !== pathname) {
          startSave();
          waitForSave(() => {
            localStorage.setItem(localUserKey(LocalKey.url), view);
            push(view);
            setView('');
            // Jump to first uncompleted step
            setCurrentStep('');
          }, 400);
        }
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, pathname]);

  return (
    <div>
      {t.title}
      <IconButton
        id="complete"
        className={classes.actionButton}
        title={t.title}
        onClick={handleToggleComplete}
      >
        {complete ? (
          <CompleteIcon id="step-yes" />
        ) : (
          <NotCompleteIcon id="step-no" />
        )}
      </IconButton>
    </div>
  );
};
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'passageDetailStepComplete' }),
});
export default connect(mapStateToProps)(
  PassageDetailStepComplete
) as any as any;
