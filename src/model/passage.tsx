import { RecordRelationship, RecordHasManyRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface Passage extends BaseModel {
  attributes: {
    sequencenum: number;
    book: string;
    reference: string;
    hold: boolean;
    title: string;
    lastComment: string;
    stepComplete: string; //json
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    section: RecordRelationship;
    users: RecordHasManyRelationship;
    media: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
  startChapter?: number; //calculated
  endChapter?: number; //calculated
  startVerse?: number; //calculated
  endVerse?: number; //calculated
}
export default Passage;
