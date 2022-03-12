import {
  Checkbox,
  createStyles,
  FormControlLabel,
  makeStyles,
  Theme,
} from '@material-ui/core';
import { useEffect, useState } from 'react';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { IPassageDetailStepCompleteStrings, IState } from '../../model';
import localStrings from '../../selector/localize';
import { connect } from 'react-redux';
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    actionButton: {
      color: theme.palette.primary.light,
      margin: theme.spacing(3),
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
  } = usePassageDetailContext();
  const classes = useStyles();
  const [, setCurrentIndex] = useState(-1);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    var curIndex = orgWorkflowSteps.findIndex((s) => s.id === currentstep);
    setCurrentIndex(curIndex);
    setComplete(stepComplete(currentstep));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentstep, orgWorkflowSteps, psgCompleted]);

  const handleToggleComplete = () => {
    setStepComplete(currentstep, !complete);
    setCurrentStep(''); // setting to empty jumps to first uncompleted step
  };
  return (
    <FormControlLabel
      control={
        <Checkbox
          className={classes.actionButton}
          checked={complete}
          onChange={handleToggleComplete}
        />
      }
      labelPlacement="start"
      label={t.title}
    />
  ); /*
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
  ); */
};
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'passageDetailStepComplete' }),
});
export default connect(mapStateToProps)(
  PassageDetailStepComplete
) as any as any;
