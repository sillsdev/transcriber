import TableRelationship from './relationsihp';

interface Project {
    type: string;
    id: string;
    keys?: {
      remoteId?: string;
    };
    attributes: {
      name: string;
      projectTypeId: number;
      description: string | null;
      ownerId: number;
      organizationId: number;
      uilanguagebcp47: string | null;
      language: string;
      languageName: string | null;
      defaultFont: string | null;
      defaultFontSize: string | null;
      rtl: boolean;
      allowClaim: boolean;
      isPublic: boolean;
      dateCreated: string | null;
      dateUpdated: string | null;
      dateArchived: string | null;
    };
    relationships: {
      type: TableRelationship;
      owner: TableRelationship;
      organization: TableRelationship;
      projectintegrations: TableRelationship;
      users: TableRelationship;
      sets: TableRelationship;
    };
  };
export default Project;  