import { Record, RecordRelationship } from '@orbit/data';

export interface Passage extends Record {
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
export default Passage;
