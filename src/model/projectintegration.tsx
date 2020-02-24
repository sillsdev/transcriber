import { RecordRelationship } from '@orbit/data';
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
  };
}
export default ProjectIntegration;
