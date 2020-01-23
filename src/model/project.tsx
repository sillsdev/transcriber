import { Record, RecordRelationship } from '@orbit/data';

export interface Project extends Record {
  attributes: {
    name: string;
    slug: string;
    description: string | null;
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
    lastModifiedBy: number;
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
}
export default Project;
