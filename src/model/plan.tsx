import { InitializedRecord, RecordRelationship } from '@orbit/records';
import { ITag } from '.';
import { BaseModel } from './baseModel';

export interface Plan extends BaseModel {
  attributes: {
    name: string;
    slug: string;
    flat: boolean;
    organizedBy: string;
    tags: ITag;
    sectionCount: number;
    lastModifiedBy: number;
    dateCreated: string;
    dateUpdated: string;
  };
  relationships?: {
    project: RecordRelationship;
    plantype: RecordRelationship;
    sections: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export type PlanD = Plan & InitializedRecord;

export default Plan;
