import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface Discussion extends BaseModel {
  attributes: {
    subject: string;
    segments: string;
    resolved: boolean;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
    offlineId: string;
    offlineMediafileId: string;
  };
  relationships?: {
    mediafile: RecordRelationship;
    group: RecordRelationship;
    user: RecordRelationship;
    artifactCategory: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
    orgWorkflowStep: RecordRelationship;
  };
}
export default Discussion;
