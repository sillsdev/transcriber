import { Record, RecordRelationship } from '@orbit/data';

export interface ProjectType extends Record {
  attributes: {
    name: string;
    description: string | null;
  };
  relationships?: {
    projects: RecordRelationship;
  };
}
export default ProjectType;
