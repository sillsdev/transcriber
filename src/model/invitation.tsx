import { InitializedRecord, RecordRelationship } from '@orbit/records';
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
    lastModifiedByUser: RecordRelationship;
  };
}

export type InvitationD = Invitation & InitializedRecord;

export default Invitation;
