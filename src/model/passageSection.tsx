import { Record, RecordRelationship } from '@orbit/data';

export interface PassageSection extends Record {
  attributes: {};
  relationships?: {
    section: RecordRelationship;
    passage: RecordRelationship;
  };
}
export default PassageSection;
