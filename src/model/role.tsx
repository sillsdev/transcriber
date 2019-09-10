import { Record, RecordRelationship } from '@orbit/data';

export interface Role extends Record {
  attributes: {
    orgRole: boolean;
    groupRole: boolean;
    roleName: string;
  };
  relationships?: {
    organization: RecordRelationship;
    users: RecordRelationship;
  };
}
export default Role;
