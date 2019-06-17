import { Record, RecordRelationship } from '@orbit/data';

export interface Role extends Record {
  attributes: {
    roleName: string;
    organizationId: number;
  };
  relationships?: {
    organization: RecordRelationship;
    users: RecordRelationship;
  };
}
export default Role;
