import React from 'react';
import {
  IActivityStateStrings,
  ActivityStates,
  localizeActivityState,
} from '../model';
import { Chip } from '@material-ui/core';

interface IStateProps {
  ta: IActivityStateStrings;
}

interface IProps extends IStateProps {
  state: ActivityStates | string;
}

export const NextAction = (props: IProps) => {
  const { state, ta } = props;
  switch (state) {
    case ActivityStates.NoMedia:
    case ActivityStates.TranscribeReady:
    case ActivityStates.Transcribing:
    case ActivityStates.NeedsNewTranscription:
    case ActivityStates.NeedsNewRecording:
    case ActivityStates.Incomplete:
      return ta.transcribe;
    case ActivityStates.Transcribed:
    case ActivityStates.Reviewing:
      return ta.review;
    case ActivityStates.Synced:
    case ActivityStates.Done:
      return ta.done;
  }
  return '';
};

const FlagText = (props: IProps) => {
  const { state, ta } = props;
  switch (state) {
    case ActivityStates.NoMedia:
    case ActivityStates.NeedsNewRecording:
    case ActivityStates.NeedsNewTranscription:
    case ActivityStates.Incomplete:
    case ActivityStates.Approved:
    case ActivityStates.Transcribing:
    case ActivityStates.Reviewing:
      return localizeActivityState(state, ta);
    default:
      return undefined;
  }
};

export const ChipText = (props: IProps) => FlagText(props) || NextAction(props);

const ChipColor = (props: IProps) => {
  const { ta } = props;
  const flagText = FlagText(props);
  if (flagText && [ta.transcribing, ta.reviewing].includes(flagText)) {
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
