import { RecordRelationship } from '@orbit/data';
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
export default SectionResource;
