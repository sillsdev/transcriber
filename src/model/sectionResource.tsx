import { InitializedRecord, RecordRelationship } from '@orbit/records';
import { BaseModel } from './baseModel';

export interface SectionResource extends BaseModel {
  attributes: {
    sequenceNum: number;
    description: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    project: RecordRelationship;
    section: RecordRelationship;
    passage: RecordRelationship;
    mediafile: RecordRelationship;
    orgWorkflowStep: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export type SectionResourceD = SectionResource & InitializedRecord;

export default SectionResource;
