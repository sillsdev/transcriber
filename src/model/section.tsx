import { Record, RecordRelationship } from '@orbit/data';

export interface Section extends Record {
  attributes: {
    sequencenum: number;
    name: string;
    state: string;
    planId: number;
  };
  relationships?: {
    // project: RecordRelationship;
    plan: RecordRelationship;
    tasks: RecordRelationship;
  };
}
export default Section;
