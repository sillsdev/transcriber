import { InitializedRecord, RecordRelationship } from '@orbit/records';
import { BaseModel } from './baseModel';
export interface OrgKeytermTarget extends BaseModel {
  attributes: {
    term: string;
    termIndex: number;
    target: string;
    offlineId: string;
    offlineMediafileId: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    organization: RecordRelationship;
    mediafile: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export type OrgKeytermTargetD = OrgKeytermTarget & InitializedRecord;

export default OrgKeytermTarget;
