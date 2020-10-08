import { Record } from '@orbit/data';
import { IActivityStateStrings } from '.';

export enum ActivityStates {
  NoMedia = 'noMedia',
  TranscribeReady = 'transcribeReady',
  Transcribing = 'transcribing',
  Transcribed = 'transcribed',
  Reviewing = 'reviewing',
  Approved = 'approved',
  NeedsNewTranscription = 'needsNewTranscription',
  Done = 'done',
  NeedsNewRecording = 'needsNewRecording',
  Synced = 'synced',
  Incomplete = 'incomplete',
}
export interface ActivityState extends Record {
  attributes: {
    state: string;
    sequencenum: string;
  };
  relationships?: {};
}
export default ActivityState;

export const localizeActivityState = (
  state: string,
  t: IActivityStateStrings
) => {
  switch (state) {
    case ActivityStates.Approved:
      return t.approved;
    case ActivityStates.Done:
      return t.done;
    case ActivityStates.Incomplete:
      return t.incomplete;
    case ActivityStates.NeedsNewRecording:
      return t.needsNewRecording;
    case ActivityStates.NeedsNewTranscription:
      return t.needsNewTranscription;
    case ActivityStates.NoMedia:
      return t.noMedia;
    case ActivityStates.Reviewing:
      return t.reviewing;
    case ActivityStates.Synced:
      return t.done;
    case ActivityStates.TranscribeReady:
      return t.transcribeReady;
    case ActivityStates.Transcribed:
      return t.transcribed;
    case ActivityStates.Transcribing:
      return t.transcribing;
  }
};
