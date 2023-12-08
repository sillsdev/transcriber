import {
  InitializedRecord,
  RecordRelationship,
  UninitializedRecord,
} from '@orbit/records';

export enum RoleNames {
  Admin = 'Admin',
  Member = 'Member',
  SuperAdmin = 'SuperAdmin',
}

export interface Role extends UninitializedRecord {
  attributes: {
    orgRole: boolean;
    roleName: string;
  };
  relationships?: {
    organization: RecordRelationship;
    users: RecordRelationship;
  };
}

export type RoleD = Role & InitializedRecord;

export default Role;
