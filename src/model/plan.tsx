import { Record, RecordRelationship } from '@orbit/data';
import { ITag } from '.';

export interface Plan extends Record {
  attributes: {
    name: string;
    slug: string;
    flat: boolean;
    organizedBy: string;
    tags: ITag;
    lastModifiedBy: number;
  };
  relationships?: {
    project: RecordRelationship;
    plantype: RecordRelationship;
    sections: RecordRelationship;
  };
}
export default Plan;
