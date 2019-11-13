import { Record, RecordRelationship } from '@orbit/data';

export interface Invitation extends Record {
  attributes: {
    email: string;
    silId: number;
    accepted: boolean;
    strings: string;
    loginLink: string;
    dateCreated: string;
    dateUpdated: string;
    lastModfiedBy: number;
  };
  relationships?: {
    organization: RecordRelationship;
    role: RecordRelationship;
    allUsersRole: RecordRelationship;
    group: RecordRelationship;
    groupRole: RecordRelationship;
  };
}
export default Invitation;
