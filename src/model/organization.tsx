import { Record, RecordRelationship } from '@orbit/data';

export interface Organization extends Record {
    attributes: {
      name: string;
      slug: string;
      websiteUrl: string;
      logoUrl: string;
      publicByDefault: string;
    };
    relationships?: {
      owner: RecordRelationship;
      users: RecordRelationship;
      groups: RecordRelationship;
      userRoles: RecordRelationship;
    };
  }

  export default Organization;