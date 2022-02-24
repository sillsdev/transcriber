import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core';
import { Stage } from '../../control/Stage';
import usePassageDetailContext from '../../context/usePassageDetailContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      margin: theme.spacing(1),
    },
  })
);

export function WorkflowSteps() {
  const { workflow, stepComplete, currentstep, setCurrentStep } =
    usePassageDetailContext();
  const classes = useStyles();
  const theme = useTheme();

  const curColor = (id: string) => {
    return id === currentstep
      ? theme.palette.secondary.light
      : stepComplete(id)
      ? theme.palette.grey[300]
      : undefined;
  };

  const handleSelect = (item: string) => {
    if (item === currentstep) {
      //do nothing;
    } else {
      setCurrentStep(item);
    }
  };

  return (
    <div className={classes.root}>
      {workflow.map((w) => {
        return (
          <Stage
            key={w.id}
            id={w.id}
            label={w.label}
            color={curColor(w.id)}
            textColor={
              w.id === currentstep
                ? theme.palette.secondary.contrastText
                : '#000000'
            }
            done={stepComplete(w.id)}
            select={handleSelect}
          />
        );
      })}
    </div>
  );
}
