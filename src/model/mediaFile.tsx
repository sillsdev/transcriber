import { Record, RecordRelationship } from '@orbit/data';

export interface MediaFiles extends Record {
    attributes: {
      passageId: number;
      versionNumber: number;
      artifactType: string;
      eafUrl: string;
      audioUrl: string;
      duration: number;
      contentType: string;
      audioQuality: string;
      textQuality: string;
      transcription: string;
      dateCreated: string | null;
      dateUpdated: string | null;
    };
    relationships?: {
      task: RecordRelationship;
    };
  };
export default MediaFiles;  