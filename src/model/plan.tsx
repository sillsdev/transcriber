import { Record, RecordRelationship } from '@orbit/data';

export interface Plan extends Record {
  attributes: {
    name: string;
    slug: string;
    lastModifiedBy: number;
  };
  relationships?: {
    project: RecordRelationship;
    plantype: RecordRelationship;
    sections: RecordRelationship;
  };
}
export default Plan;
