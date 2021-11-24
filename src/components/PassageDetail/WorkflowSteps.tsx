import React, { useMemo } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core';
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
  const { workflow, psgCompletedIndex, currentstep, setCurrentStep } =
    usePassageDetailContext();
  const classes = useStyles();

  const index = useMemo(
    () => (workflow ? workflow.findIndex((wf) => wf.id === currentstep) : 0),
    [currentstep, workflow]
  );

  const curColor = (i: number) => {
    return i === index
      ? 'lightblue'
      : i <= psgCompletedIndex
      ? 'lightgreen'
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
      {workflow.map((w, i) => {
        return (
          <Stage
            key={w.id}
            id={w.id}
            label={w.label}
            color={curColor(i)}
            done={i <= psgCompletedIndex}
            select={handleSelect}
          />
        );
      })}
    </div>
  );
}
