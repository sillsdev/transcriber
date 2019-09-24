import { Record, RecordRelationship } from '@orbit/data';

export interface Plan extends Record {
  attributes: {
    name: string;
    slug: string;
  };
  relationships?: {
    project: RecordRelationship;
    plantype: RecordRelationship;
    sections: RecordRelationship;
  };
}
export default Plan;
