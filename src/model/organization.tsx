import { Record, RecordRelationship } from '@orbit/data';

export interface Organization extends Record {
  attributes: {
    name: string;
    slug: string;
    silId: number;
    description: string | null;
    websiteUrl: string | null;
    logoUrl: string | null;
    publicByDefault: boolean;
    dateCreated: string | null;
    dateUpdated: string | null;
    lastModifiedBy: number;
  };
  relationships?: {
    owner: RecordRelationship;
    users: RecordRelationship;
    groups: RecordRelationship;
  };
}

export default Organization;
