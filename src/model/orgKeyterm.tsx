import { InitializedRecord, RecordRelationship } from '@orbit/records';
import { BaseModel } from './baseModel';
export interface OrgKeyterm extends BaseModel {
  attributes: {
    term: string;
    domain: string;
    definition: string;
    category: string;
    offlineid: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    organization: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export type OrgKeytermD = OrgKeyterm & InitializedRecord;

export default OrgKeyterm;
