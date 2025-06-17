import { InitializedRecord, RecordRelationship } from '@orbit/records';
import { BaseModel } from './baseModel';

export interface ITag {
  [tag: string]: boolean;
}
export interface ITagLocal {
  [tag: string]: string;
}
export interface VProject extends BaseModel {
  attributes: {
    name: string;
    slug: string;
    description: string | null;
    uilanguagebcp47: string | null;
    language: string;
    languageName: string | null;
    isPublic: boolean;
    spellCheck: boolean | null;
    defaultFont: string | null;
    defaultFontSize: string | null;
    rtl: boolean;
    flat: boolean;
    organizedBy: string;
    sectionCount: number;
    tags: ITag;
    type: string;
    defaultParams: string;
    dateCreated: string;
    dateUpdated: string;
    dateArchived: string;
    lastModifiedBy: number;
    sheetUser: string | undefined;
    sheetGroup: string | undefined;
    publishUser: string | undefined;
    publishGroup: string | undefined;
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
    lastModifiedByUser: RecordRelationship;
  };
}

export type VProjectD = VProject & InitializedRecord;

export default VProject;
