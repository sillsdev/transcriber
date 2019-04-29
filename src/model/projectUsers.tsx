import { Record, RecordRelationship } from '@orbit/data';

interface ProjectType extends Record {
    attributes: {
      userId: number;
      projectId: number;
      roleId: number;
      font: string | null;
      fontSize: string | null;
    };
    relationships?: {
      user: RecordRelationship;
      projects: RecordRelationship;
      role: RecordRelationship;
    };
  };
export default ProjectType;