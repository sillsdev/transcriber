import { Record, RecordRelationship } from '@orbit/data';

export interface OrganizationMembership extends Record {
  attributes: {
    email: string;
  };
  relationships?: {
    user: RecordRelationship;
    role: RecordRelationship;
    organiztion: RecordRelationship;
  };
}

export default OrganizationMembership;
