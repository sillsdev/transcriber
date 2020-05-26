import { RecordRelationship } from '@orbit/data';
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
  };
}
export default GroupMembership;
