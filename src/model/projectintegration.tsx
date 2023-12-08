import { InitializedRecord, RecordRelationship } from '@orbit/records';
import { BaseModel } from './baseModel';

export interface ProjectIntegration extends BaseModel {
  attributes: {
    settings: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    project: RecordRelationship;
    integration: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export type ProjectIntegrationD = ProjectIntegration & InitializedRecord;

export default ProjectIntegration;
