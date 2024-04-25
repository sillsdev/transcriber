import { RecordRelationship, InitializedRecord } from '@orbit/records';
import { BaseModel } from './baseModel';

export interface OrganizationBible extends BaseModel {
  attributes: {
    ownerorg: boolean;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    bible: RecordRelationship;
    organiztion: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export type OrganizationBibleD = OrganizationBible & InitializedRecord;

export default OrganizationBible;
