import { Record, RecordRelationship } from '@orbit/data';

export interface UserPassages extends Record {
  attributes: {
    userId: number;
    passageId: number;
    roleId: number;
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

export default UserPassages;
