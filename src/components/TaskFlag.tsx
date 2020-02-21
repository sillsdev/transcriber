import React from 'react';
import { ITaskItemStrings, ActivityStates } from '../model';
import { Chip } from '@material-ui/core';

interface IStateProps {
  t: ITaskItemStrings;
}

interface IProps extends IStateProps {
  state: ActivityStates | string;
}

export const NextAction = (props: IProps) => {
  const { state, t } = props;
  switch (state) {
    case ActivityStates.NoMedia:
    case ActivityStates.TranscribeReady:
    case ActivityStates.Transcribing:
    case ActivityStates.NeedsNewTranscription:
    case ActivityStates.NeedsNewRecording:
      return t.transcribe;
    case ActivityStates.Transcribed:
    case ActivityStates.Reviewing:
      return t.review;
    case ActivityStates.Synced:
    case ActivityStates.Done:
      return t.done;
  }
  return '';
};

const FlagText = (props: IProps) => {
  const { state, t } = props;
  switch (state) {
    case ActivityStates.NoMedia:
      return t.noMedia;
    case ActivityStates.NeedsNewRecording:
      return t.needsNewRecording;
    case ActivityStates.NeedsNewTranscription:
      return t.needsNewTranscription;
    case ActivityStates.Approved:
      return t.sync;
    case ActivityStates.Transcribing:
    case ActivityStates.Reviewing:
      return t.inProgress;
  }
};

export const ChipText = (props: IProps) => FlagText(props) || NextAction(props);

const ChipColor = (props: IProps) => {
  const flagText = FlagText(props);
  if (flagText === props.t.inProgress) {
    return { backgroundColor: 'green', color: 'white' };
  } else return flagText ? 'secondary' : 'primary';
};

export const TaskFlag = (props: IProps) => {
  const chipColor = ChipColor(props);
  const chipText = ChipText(props);
  if (chipText === '') return <></>;
  if (typeof chipColor === 'object') {
    return <Chip size="small" label={chipText} style={chipColor} />;
  }
  return <Chip size="small" label={chipText} color={chipColor} />;
};

export default React.memo(TaskFlag);
