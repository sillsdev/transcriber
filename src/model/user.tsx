import { Record, RecordRelationship } from '@orbit/data';

export interface User extends Record {
  attributes: {
    name: string;
    givenName: string;
    familyName: string;
    email: string;
    phone: string;
    timezone: string;
    locale: string;
    isLocked: boolean;
    auth0Id: string;
    dateCreated: string | null;
    dateUpdated: string | null;
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
    phone: string;
    timezone: string;
    locale: string;
    isLocked: boolean;
    auth0Id: string;
    dateCreated: string | null;
    dateUpdated: string | null;
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
