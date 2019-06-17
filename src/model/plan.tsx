import {Record, RecordRelationship} from '@orbit/data';

export interface Plan extends Record {
  attributes: {
    name: string;
    slug: string;
    plantypeId: number;
    projectId: number;
  };
  relationships?: {
    project: RecordRelationship;
    plantype: RecordRelationship;
    sections: RecordRelationship;
  };
}
export default Plan;
