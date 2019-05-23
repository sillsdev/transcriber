import { Record, RecordRelationship } from '@orbit/data';

export interface MediaFile extends Record {
    attributes: {
      passageId: number;
      planId: number;
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
      dateCreated: string | null;
      dateUpdated: string | null;
    };
    relationships?: {
      passage: RecordRelationship;
    };
  };
export default MediaFile;