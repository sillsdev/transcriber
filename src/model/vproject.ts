import { Record, RecordRelationship } from '@orbit/data';

export interface ITag {
  [tag: string]: boolean;
}
export interface ITagLocal {
  [tag: string]: string;
}
export interface VProject extends Record {
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
    flat: boolean;
    organizedBy: string;
    tags: ITag;
    type: string;
    dateCreated: string;
    dateUpdated: string;
    dateArchived: string;
    lastModifiedBy: number;
    dateExported: string | null;
    dateImported: string | null;
  };
  relationships?: {
    project: RecordRelationship;
    plantype: RecordRelationship;
    sections: RecordRelationship;
    projecttype: RecordRelationship;
    owner: RecordRelationship;
    organization: RecordRelationship;
    group: RecordRelationship;
    projectintegrations: RecordRelationship;
    users: RecordRelationship;
  };
}
export default VProject;
