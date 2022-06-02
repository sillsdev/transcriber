import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface MediaFile extends BaseModel {
  attributes: {
    planId: number; //allow this because we use axios to create a mediafile
    versionNumber: number;
    artifactType: string | null;
    eafUrl: string | null;
    audioUrl: string;
    duration: number;
    contentType: string;
    audioQuality: string | null;
    textQuality: string | null;
    transcription: string | null;
    originalFile: string;
    filesize: number;
    position: number;
    segments: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
    languagebcp47: string | null;
    link: boolean;
    readyToShare: boolean;
    performedBy: string | null;
    resourcePassageId: number | null;
    offlineId: string;
    sourceSegments: string;
    sourceMediaOfflineId: string;
    transcriptionstate: string;
    topic: string;
  };
  relationships?: {
    passage: RecordRelationship;
    resourcePassage: RecordRelationship;
    plan: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
    artifactType: RecordRelationship;
    artifactCategory: RecordRelationship;
    orgWorkflowStep: RecordRelationship;
    recordedbyUser: RecordRelationship;
    sourceMedia: RecordRelationship;
  };
}
export default MediaFile;
