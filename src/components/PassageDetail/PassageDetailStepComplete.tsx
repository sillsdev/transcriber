import { createStyles, IconButton, makeStyles, Theme } from '@material-ui/core';
import CompleteIcon from '@material-ui/icons/CheckBoxOutlined';
import NotCompleteIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import { useEffect, useState } from 'react';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { IPassageDetailStepCompleteStrings, IState } from '../../model';
import localStrings from '../../selector/localize';
import { connect } from 'react-redux';
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
  } = usePassageDetailContext();
  const classes = useStyles();
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    console.log('currentstep, orgWorkflowsteps');
    var curIndex = orgWorkflowSteps.findIndex((s) => s.id === currentstep);
    setCurrentIndex(curIndex);
    setComplete(stepComplete(currentstep));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentstep, orgWorkflowSteps]);

  const handleToggleComplete = () => {
    setStepComplete(currentstep, !complete);
    if (!complete) {
      //turning it on so go to next step
      if (currentIndex < orgWorkflowSteps.length - 1) {
        setCurrentStep(orgWorkflowSteps[currentIndex + 1].id);
      }
    } else setComplete(!complete);
  };

  return (
    <div>
      {t.title}
      <IconButton
        id="complete"
        className={classes.actionButton}
        title={t.title}
        onClick={handleToggleComplete}
      >
        {complete ? <CompleteIcon /> : <NotCompleteIcon />}
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
