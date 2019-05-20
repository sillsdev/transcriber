import { Record, RecordRelationship } from '@orbit/data';

export interface Project extends Record {
    attributes: {
      name: string;
      projectTypeId: number;
      description: string | null;
      ownerId: number;
      organizationId: number;
      groupId: number;
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
    relationships?: {
      projecttype: RecordRelationship;
      owner: RecordRelationship;
      organization: RecordRelationship;
      group: RecordRelationship;
      projectintegrations: RecordRelationship;
      users: RecordRelationship;
      plans: RecordRelationship;
    };
  };
export default Project;  