import { Record, RecordRelationship } from '@orbit/data';

export enum RoleNames {
  Admin = 'Admin',
  Member = 'Member',
  SuperAdmin = 'SuperAdmin',
}

export interface Role extends Record {
  attributes: {
    orgRole: boolean;
    roleName: string;
  };
  relationships?: {
    organization: RecordRelationship;
    users: RecordRelationship;
  };
}
export default Role;
