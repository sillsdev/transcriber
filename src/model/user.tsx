import { Record, RecordRelationship } from '@orbit/data';

export interface User extends Record {
  attributes: {
    name: string;
    email: string;
    locale: string;
    phone: string;
    timezone: string;
  };
  relationships?: {
    projectUsers: RecordRelationship;
    organizationMemberships: RecordRelationship;
    userRoles: RecordRelationship;
    ownedOrganizations: RecordRelationship;
  };
};

export default User;  