import React from 'react';
import { ITaskItemStrings, ActivityStates } from '../model';
import { Chip } from '@material-ui/core';
import Pencil from '@material-ui/icons/Edit';

interface IStateProps {
  t: ITaskItemStrings;
}

interface IProps extends IStateProps {
  state: ActivityStates;
}

export const NextAction = (props: IProps) => {
  const { state, t } = props;
  let text: string = t.noMedia;
  switch (state) {
    case ActivityStates.NoMedia:
    case ActivityStates.TranscribeReady:
    case ActivityStates.Transcribing:
    case ActivityStates.NeedsNewTranscription:
    case ActivityStates.NeedsNewRecording:
      text = t.transcribe;
      break;
    case ActivityStates.Transcribed:
    case ActivityStates.Reviewing:
      text = t.review;
      break;
    case ActivityStates.Approved:
      text = t.sync;
      break;
    case ActivityStates.Synced:
    case ActivityStates.Done:
      text = t.done;
      break;
  }
  return text;
};

export const TaskFlag = (props: IProps) => {
  const { t } = props;

  const Flag = ({ state }: { state: string }) => {
    let text = undefined;
    switch (state) {
      case ActivityStates.NoMedia:
        text = t.noMedia;
        break;
      case ActivityStates.NeedsNewRecording:
        text = t.needsNewRecording;
        break;
      case ActivityStates.NeedsNewTranscription:
        text = t.needsNewTranscription;
        break;
      case ActivityStates.Transcribing:
      case ActivityStates.Reviewing:
        text = t.inProgress;
        break;
    }
    if (!text) return <></>;
    return <Chip size="small" label={text} color="secondary" />;
  };

  const Next = (props: IProps) => {
    return (
      <Chip
        size="small"
        icon={<Pencil />}
        label={NextAction(props)}
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
