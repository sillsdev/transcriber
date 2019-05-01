import { Record, RecordRelationship } from '@orbit/data';

export interface OrganizationMembership extends Record {
    attributes: {
      email: string;
      userId: number;
      organizationId: number;
    };
    relationships?: {
      user: RecordRelationship;
      organiztion: RecordRelationship;
    };
  }

  export default OrganizationMembership;