import React, { useState, useMemo } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core';
import { Stage } from '../control/Stage';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      margin: theme.spacing(1),
    },
  })
);
export const PassageStage = () => {
  const classes = useStyles();
  const [selected, setSelected] = useState('');
  const workflow = useMemo(
    () => [
      'Internalization',
      'Draft',
      'Team Check',
      'Key Terms',
      'Community',
      'Back Translate',
      'Consultant',
      'Review',
      'Final Edit',
      'Final Read',
    ],
    []
  );
  const index = useMemo(() => workflow.indexOf(selected), [selected, workflow]);

  const curColor = (i: number) => {
    return i < index ? 'lightgreen' : i === index ? 'lightblue' : undefined;
  };

  const handleSelect = (item: string) => {
    setSelected(item);
  };

  return (
    <div className={classes.root}>
      {workflow.map((w, i) => {
        return (
          <Stage
            label={w}
            color={curColor(i)}
            done={i < index}
            select={handleSelect}
          />
        );
      })}
    </div>
  );
};
