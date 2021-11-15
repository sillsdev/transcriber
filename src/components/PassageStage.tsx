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
  const [done, setDone] = useState(false);
  const workflow = useMemo(
    () => [
      'Internalization',
      'Record',
      'Team Check',
      'Key Terms',
      'Peer Review',
      'Community',
      'Back Translate',
      'Consultant',
      'Review',
      'Final Read',
    ],
    []
  );
  const index = useMemo(
    () => workflow.indexOf(selected) + (done ? 1 : 0),
    [done, selected, workflow]
  );

  const curColor = (i: number) => {
    return i < index ? 'lightgreen' : i === index ? 'lightblue' : undefined;
  };

  const handleSelect = (item: string) => {
    if (item === selected) {
      if (!done) setDone(true);
    } else {
      setSelected(item);
      const newDone = item === workflow[index];
      if (done !== newDone) setDone(newDone);
    }
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
