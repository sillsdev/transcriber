import {
  Record,
  RecordRelationship,
  RecordHasManyRelationship,
} from '@orbit/data';
import { ActivityStates } from '.';

export interface Passage extends Record {
  attributes: {
    sequencenum: number;
    book: string;
    reference: string;
    state: ActivityStates;
    hold: boolean;
    title: string;
    lastComment: string;
    dateCreated: string | null;
    dateUpdated: string | null;
  };
  relationships?: {
    sections: RecordHasManyRelationship;
    users: RecordHasManyRelationship;
    media: RecordRelationship;
  };
  startChapter: number; //calculated
  endChapter: number; //calculated
  startVerse: number; //calculated
  endVerse: number; //calculated
}
export default Passage;
