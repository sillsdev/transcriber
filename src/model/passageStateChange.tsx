import { Record, RecordRelationship } from '@orbit/data';

export interface PassageStateChange extends Record {
  attributes: {
    state: string;
    comments: string;
    dateCreated: Date;
    lastModifiedBy: number /* userid */;
  };
  relationships?: {
    passage: RecordRelationship;
  };
}
export default PassageStateChange;
