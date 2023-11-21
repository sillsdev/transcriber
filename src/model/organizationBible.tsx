import { RecordRelationship } from '@orbit/data';
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

export default OrganizationBible;
