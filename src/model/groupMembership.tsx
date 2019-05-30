import { Record, RecordRelationship } from '@orbit/data';

export interface GroupMembership extends Record {
    attributes: {
      font: string;
      fontSize: string;
    };
    relationships?: {
      user: RecordRelationship;
      group: RecordRelationship;
      role: RecordRelationship;
    };
  };
export default GroupMembership;
