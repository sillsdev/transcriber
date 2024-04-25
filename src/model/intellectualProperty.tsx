import { InitializedRecord, RecordRelationship } from '@orbit/records';
import { BaseModel } from './baseModel';

export interface IntellectualProperty extends BaseModel {
  attributes: {
    rightsHolder: string; //performedBy in mediafile
    notes: string;
    offlineId: string;
    offlineMediafileId: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    organization: RecordRelationship;
    releaseMediafile: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export type IntellectualPropertyD = IntellectualProperty & InitializedRecord;

export default IntellectualProperty;
