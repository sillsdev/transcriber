import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface Group extends BaseModel {
  attributes: {
    name: string;
    abbreviation: string;
    ownerId: number;
    permissions: string;
    allUsers: boolean;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    owner: RecordRelationship;
    projects: RecordRelationship;
    groupMemberships: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}
export default Group;
