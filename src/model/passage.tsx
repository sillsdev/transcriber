import {
  Record,
  RecordRelationship,
  RecordHasManyRelationship,
} from '@orbit/data';

export interface Passage extends Record {
  attributes: {
    sequencenum: number;
    book: string;
    reference: string;
    position: number;
    state: string;
    hold: boolean;
    title: string;
    dateCreated: string | null;
    dateUpdated: string | null;
  };
  relationships?: {
    sections: RecordHasManyRelationship;
    users: RecordHasManyRelationship;
    media: RecordRelationship;
  };
}
export default Passage;
