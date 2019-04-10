import TableRelationship from './relationsihp';

interface ProjectType {
    type: string;
    id: string;
    attributes: {
      name: string;
      description: string | null;
    };
    relationships: {
      projects: TableRelationship;
    };
  };
export default ProjectType;  