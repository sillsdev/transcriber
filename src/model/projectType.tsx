import TableRelationship from './relationsihp';

interface ProjectType {
    type: string;
    id: string;
    keys?: {
      remoteId?: string;
    };
    attributes: {
      name: string;
      description: string | null;
    };
    relationships: {
      projects: TableRelationship;
    };
  };
export default ProjectType;  