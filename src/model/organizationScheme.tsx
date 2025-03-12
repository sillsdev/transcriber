import { InitializedRecord, RecordRelationship } from '@orbit/records';
import { BaseModel } from './baseModel';

export interface OrganizationScheme extends BaseModel {
  attributes: {
    name: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    organization: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export type OrganizationSchemeD = OrganizationScheme & InitializedRecord;

export default OrganizationScheme;
