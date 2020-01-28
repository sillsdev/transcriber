import { Record, RecordRelationship } from '@orbit/data';

export interface OrganizationMembership extends Record {
  attributes: {
    dateCreated: string | null;
    dateUpdated: string | null;
    lastModifiedBy: string | null;
  };
  relationships?: {
    user: RecordRelationship;
    role: RecordRelationship;
    organiztion: RecordRelationship;
  };
}

export default OrganizationMembership;
