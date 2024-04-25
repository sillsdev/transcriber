import { InitializedRecord, RecordRelationship } from '@orbit/records';
import { BaseModel } from './baseModel';

export interface GroupMembership extends BaseModel {
  attributes: {
    font: string;
    fontSize: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    user: RecordRelationship;
    group: RecordRelationship;
    role: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export type GroupMembershipD = GroupMembership & InitializedRecord;

export default GroupMembership;
