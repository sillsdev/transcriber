import { Record, RecordRelationship } from '@orbit/data';

export interface Group extends Record {
    attributes: {
      name: string;
      organizationId: number;
    };
    relationships?: {
      organization: RecordRelationship;
      users: RecordRelationship;
    };
  };
export default Group;
