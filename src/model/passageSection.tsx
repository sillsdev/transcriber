import { Record, RecordRelationship } from '@orbit/data';

export interface PassageSection extends Record {
    attributes: {
      passageId: number;
      sectionId: number;
    };
    relationships?: {
      section: RecordRelationship;
      passage: RecordRelationship;
    };
  };
export default PassageSection;
