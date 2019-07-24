import { Record, RecordRelationship } from '@orbit/data';

export interface UserPassage extends Record {
  attributes: {
    comment: string;
    dateCreated: string | null;
    dateUpdated: string | null;
  };
  relationships?: {
    user: RecordRelationship;
    passage: RecordRelationship;
    role: RecordRelationship;
  };
}

export default UserPassage;
