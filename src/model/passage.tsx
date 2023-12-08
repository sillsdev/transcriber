import {
  RecordRelationship,
  RecordHasManyRelationship,
  InitializedRecord,
} from '@orbit/records';
import { BaseModel } from './baseModel';

export interface Passage extends BaseModel {
  attributes: {
    sequencenum: number;
    book: string;
    reference: string;
    state: string; //backwardcompatibility only
    hold: boolean;
    title: string;
    lastComment: string;
    stepComplete: string; //json
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
    startChapter?: number; //calculated in online db
    endChapter?: number; //calculated
    startVerse?: number; //calculated
    endVerse?: number; //calculated
  };
  relationships?: {
    section: RecordRelationship;
    users: RecordHasManyRelationship;
    media: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
    sharedResource: RecordRelationship;
    passagetype: RecordRelationship;
  };
}

export type PassageD = Passage & InitializedRecord;

export default Passage;
