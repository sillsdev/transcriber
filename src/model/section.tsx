import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface Section extends BaseModel {
  attributes: {
    sequencenum: number;
    name: string;
    graphics: string;
    published: boolean;
    level: number;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    // project: RecordRelationship;
    plan: RecordRelationship;
    passages: RecordRelationship;
    transcriber: RecordRelationship;
    editor: RecordRelationship;
    group: RecordRelationship;
    artifactCategory: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}
export default Section;
