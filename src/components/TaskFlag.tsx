import React from 'react';
import { ITaskItemStrings } from '../model';
import { Chip } from '@material-ui/core';
import Pencil from '@material-ui/icons/Edit';

interface IStateProps {
  t: ITaskItemStrings;
}

interface IProps extends IStateProps {
  state: string;
}

export const NextState = (props: IProps) => {
  const { state, t } = props;

  let text = state[0].toLocaleUpperCase() + state.slice(1);
  if (/trans|noMedia/i.test(state)) text = t.transcribe;
  if (/transcribed|review/i.test(state)) text = t.review;
  if (/appr/i.test(state)) text = t.sync;
  if (/syn|done/i.test(state)) text = t.done;
  return text;
};

export const TaskFlag = (props: IProps) => {
  const { t } = props;

  const Flag = ({ state }: { state: string }) => {
    let text = undefined;
    if (state === 'noMedia') text = t.noMedia;
    if (state === 'transcribing' || state === 'reviewing') text = t.inProgress;
    if (!text) return <></>;
    return <Chip size="small" label={text} color="secondary" />;
  };

  const Next = (props: IProps) => {
    return (
      <Chip
        size="small"
        icon={<Pencil />}
        label={NextState(props)}
        color="primary"
      />
    );
  };

  return (
    <>
      <Next {...props} />
      {'\u00A0'}
      <Flag {...props} />
    </>
  );
};

export default TaskFlag;
