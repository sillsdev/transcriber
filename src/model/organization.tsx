import { InitializedRecord, RecordRelationship } from '@orbit/records';
import { BaseModel } from './baseModel';

export interface Organization extends BaseModel {
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
  };
  relationships?: {
    bible: RecordRelationship;
    owner: RecordRelationship;
    groups: RecordRelationship;
    cluster: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export type OrganizationD = Organization & InitializedRecord;

export default Organization;
