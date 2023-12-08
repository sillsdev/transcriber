import { InitializedRecord, RecordRelationship } from '@orbit/records';
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
    titleMediafile: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export type SectionD = Section & InitializedRecord;

export default Section;
