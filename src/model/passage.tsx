import { Record, RecordRelationship } from '@orbit/data';

export interface Task extends Record {
    attributes: {
      reference: string;
      passage: number;
      position: number;
      taskState: string;
      hold: boolean;
      title: string;
      dateCreated: string | null;
      dateUpdated: string | null;
    };
    relationships?: {
      set: RecordRelationship;
      media: RecordRelationship;
    };
  };
export default Task;  