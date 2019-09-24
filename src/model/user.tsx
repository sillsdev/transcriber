import { Record, RecordRelationship } from '@orbit/data';

export interface User extends Record {
  attributes: {
    name: string;
    givenName: string;
    familyName: string;
    email: string;
    phone: string | null;
    timezone: string | null;
    locale: string | null;
    avatarUrl: string | null;
    isLocked: boolean;
    dateCreated: string | null;
    dateUpdated: string | null;
    lastModifiedBy: string | null;
  };
  relationships?: {
    ownedOrganizations: RecordRelationship;
    projects: RecordRelationship;
    organizationMemberships: RecordRelationship;
    roles: RecordRelationship;
    groups: RecordRelationship;
  };
}

export interface CurrentUser extends Record {
  attributes: {
    name: string;
    givenName: string;
    familyName: string;
    email: string;
    phone: string | null;
    timezone: string | null;
    locale: string | null;
    isLocked: boolean;
    dateCreated: string | null;
    dateUpdated: string | null;
    lastModifiedBy: string | null;
  };
  relationships?: {
    ownedOrganizations: RecordRelationship;
    projects: RecordRelationship;
    organizationMemberships: RecordRelationship;
    roles: RecordRelationship;
    groups: RecordRelationship;
  };
}

export default User;
