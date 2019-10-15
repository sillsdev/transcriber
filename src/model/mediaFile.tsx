import { Record, RecordRelationship } from '@orbit/data';

export interface MediaFile extends Record {
  attributes: {
    planId: number; //allow this because we use axios to create a mediafile
    versionNumber: number;
    artifactType: string;
    eafUrl: string;
    audioUrl: string;
    duration: number;
    contentType: string;
    audioQuality: string;
    textQuality: string;
    transcription: string;
    originalFile: string;
    filesize: number;
    position: number;
    dateCreated: string | null;
    dateUpdated: string | null;
  };
  relationships?: {
    passage: RecordRelationship;
    plan: RecordRelationship;
  };
}
export default MediaFile;
