import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface Invitation extends BaseModel {
  attributes: {
    email: string;
    silId: number;
    accepted: boolean;
    strings: string;
    loginLink: string;
    invitedBy: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    organization: RecordRelationship;
    role: RecordRelationship;
    allUsersRole: RecordRelationship;
    group: RecordRelationship;
    groupRole: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}
export default Invitation;
