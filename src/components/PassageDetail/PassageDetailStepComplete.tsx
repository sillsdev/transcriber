import { useEffect, useState } from 'react';
import { useGlobal } from 'reactn';
import { createStyles, IconButton, makeStyles, Theme } from '@material-ui/core';
import CompleteIcon from '@mui/icons-material/CheckBoxOutlined';
import NotCompleteIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { IPassageDetailStepCompleteStrings, IState } from '../../model';
import localStrings from '../../selector/localize';
import { connect } from 'react-redux';
import { getPasIdByNum } from '../../crud';
import { usePassageNavigate } from './usePassageNavigate';

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
  const [, setCurrentIndex] = useState(-1);
  const [complete, setComplete] = useState(false);
  const [view, setView] = useState('');
  const passageNavigate = usePassageNavigate(() => {
    setView('');
  });

  useEffect(() => {
    var curIndex = orgWorkflowSteps.findIndex((s) => s.id === currentstep);
    setCurrentIndex(curIndex);
    setComplete(stepComplete(currentstep));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentstep, orgWorkflowSteps, psgCompleted]);

  const handleToggleComplete = () => {
    const curStatus = complete;
    setStepComplete(currentstep, !complete);
    setCurrentStep(''); // setting to empty jumps to first uncompleted step
    const seq = passage?.attributes?.sequencenum;
    const pasId = getPasIdByNum(section, seq + 1, memory);
    if (pasId && !curStatus) setView(`/detail/${prjId}/${pasId}`);
  };

  useEffect(() => {
    passageNavigate(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  return (
    <div>
      {t.title}
      <IconButton
        id="complete"
        className={classes.actionButton}
        title={t.title}
        onClick={handleToggleComplete}
        disabled={view !== ''}
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
