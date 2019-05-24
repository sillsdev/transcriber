import { Record, RecordRelationship } from '@orbit/data';

export interface Group extends Record {
    attributes: {
      name: string;
      abbreviation: string;
    };
    relationships?: {
      owner: RecordRelationship;
      projects: RecordRelationship;
      groupMemberships: RecordRelationship;
    };
  };
export default Group;
