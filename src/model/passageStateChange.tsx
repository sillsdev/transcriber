import { Record, RecordRelationship } from '@orbit/data';
import { ActivityStates } from '.';

export interface PassageStateChange extends Record {
  attributes: {
    state: ActivityStates;
    comments: string;
    dateCreated: Date;
    lastModifiedBy: number /* userid */;
  };
  relationships?: {
    passage: RecordRelationship;
  };
}
export default PassageStateChange;
