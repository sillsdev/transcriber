import { createStyles, IconButton, makeStyles, Theme } from '@material-ui/core';
import CompleteIcon from '@material-ui/icons/CheckBoxOutlined';
import NotCompleteIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import { useEffect, useState } from 'react';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { UpdateRelatedRecord } from '../../model/baseModel';
import { useGlobal } from 'reactn';
import { TransformBuilder } from '@orbit/data';
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
    passage,
    currentstep,
    setCurrentStep,
    psgCompletedIndex,
    orgWorkflowSteps,
  } = usePassageDetailContext();
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [complete, setComplete] = useState(false);
  const [canComplete, setCanComplete] = useState(false);

  useEffect(() => {
    var curIndex = orgWorkflowSteps.findIndex((s) => s.id === currentstep);
    setCurrentIndex(curIndex);
    setComplete(psgCompletedIndex >= curIndex);
    setCanComplete(psgCompletedIndex + 1 === curIndex);
  }, [psgCompletedIndex, currentstep, orgWorkflowSteps]);

  const handleToggleComplete = () => {
    var newstep: string | undefined = '';
    if (complete)
      //turn it off
      newstep = currentIndex === 0 ? '' : orgWorkflowSteps[currentIndex - 1].id;
    else {
      newstep = orgWorkflowSteps[currentIndex].id;
      if (currentIndex < orgWorkflowSteps.length - 1)
        setCurrentStep(orgWorkflowSteps[currentIndex + 1].id);
    }
    memory.update((t: TransformBuilder) => [
      ...UpdateRelatedRecord(
        t,
        passage,
        'orgWorkflowStep',
        'orgworkflowstep',
        newstep,
        user
      ),
    ]);
  };

  return (
    <div>
      {t.title}
      <IconButton
        id="complete"
        className={classes.actionButton}
        title={t.title}
        onClick={handleToggleComplete}
        disabled={!complete && !canComplete}
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
