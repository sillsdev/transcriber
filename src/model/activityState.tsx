import { Record } from '@orbit/data';

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
}
export interface ActivityState extends Record {
  attributes: {
    state: string;
    sequencenum: string;
  };
  relationships?: {};
}
export default ActivityState;
