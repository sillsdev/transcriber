import { Record, RecordRelationship } from '@orbit/data';

export interface ProjectIntegration extends Record {
  attributes: { settings: string };
  relationships?: {
    project: RecordRelationship;
    integration: RecordRelationship;
  };
}
export default ProjectIntegration;
