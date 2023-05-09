import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface Resource extends BaseModel {
  attributes: {
    projectName: string;
    organization: string;
    language: string;
    plan: string;
    plantype: string;
    section: string;
    sectionSequencenum: number;
    mediafileId: number;
    passageId: number;
    passageSequencenum: number;
    passageDesc: string;
    book: string;
    reference: string;
    versionNumber: number;
    audioUrl: string;
    duration: number | null;
    contentType: string;
    transcription: string | null;
    originalFile: string;
    filesize: number;
    languagebcp47: string;
    categoryName: string | null;
    typeName: string | null;
    latest: boolean;
    title: string;
    description: string;
    termsOfUse: string;
    keywords: string;
    resourceId: number;
    idList: string | null;
    s3file: string | null;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    lastModifiedByUser: RecordRelationship;
  };
}
export default Resource;
