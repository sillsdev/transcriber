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
    clusterbase: boolean;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
    defaultParams: string;
    //NR?publishingData: string;
  };
  relationships?: {
    owner: RecordRelationship;
    groups: RecordRelationship;
    cluster: RecordRelationship;
    //NR?noteProject: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export default Organization;
