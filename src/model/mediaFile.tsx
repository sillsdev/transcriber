import { Record, RecordRelationship } from '@orbit/data';

export interface TaskMedia extends Record {
    attributes: {
      taskId: number;
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
export default TaskMedia;  