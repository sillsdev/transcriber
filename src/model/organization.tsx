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
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
    defaultParams: string;
  };
  relationships?: {
    owner: RecordRelationship;
    groups: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export default Organization;
