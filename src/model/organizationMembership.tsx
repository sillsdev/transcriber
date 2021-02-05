import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface OrganizationMembership extends BaseModel {
  attributes: {
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    user: RecordRelationship;
    role: RecordRelationship;
    organiztion: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export default OrganizationMembership;
