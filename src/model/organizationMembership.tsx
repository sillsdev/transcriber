import { InitializedRecord, RecordRelationship } from '@orbit/records';
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

export type OrganizationMembershipD = OrganizationMembership &
  InitializedRecord;

export default OrganizationMembership;
