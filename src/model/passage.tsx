import { RecordRelationship, RecordHasManyRelationship } from '@orbit/data';
import { ActivityStates } from '.';
import { BaseModel } from './baseModel';

export interface Passage extends BaseModel {
  attributes: {
    sequencenum: number;
    book: string;
    reference: string;
    state: ActivityStates;
    hold: boolean;
    title: string;
    lastComment: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
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
