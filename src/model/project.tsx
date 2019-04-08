import TableRelationship from './relationsihp';

interface Project {
    type: string;
    id: string;
    attributes: {
      name: string;
      description: string;
      language: string;
      ispublic: boolean;
    };
    relationships: {
      projecttypes: TableRelationship;
      sets: TableRelationship;
      projectusers: TableRelationship;
      usertasks: TableRelationship;
      owner: TableRelationship;
      projectintegrations: TableRelationship;
      Organizations: TableRelationship;
    };
  };
export default Project;  