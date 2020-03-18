import { Record, RecordRelationship } from '@orbit/data';

export enum RoleNames {
  Transcriber = 'Transcriber',
  Editor = 'Editor',
  Admin = 'Admin',
  Member = 'Member',
  SuperAdmin = 'SuperAdmin',
}

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
