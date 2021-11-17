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
    passage: string;
    passageSequencenum: number;
    book: string;
    reference: string;
    versionNumber: number;
    audioUrl: string;
    duration: number;
    contentType: string;
    transcription: string | null;
    originalFile: string;
    filesize: number;
    languagebcp47: string | null;
    categoryName: string | null;
    typeName: string | null;
    latest: boolean;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    lastModifiedByUser: RecordRelationship;
  };
}
export default Resource;
