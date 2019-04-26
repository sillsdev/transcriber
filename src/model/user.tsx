import { Record, RecordRelationship } from '@orbit/data';

export interface User extends Record {
  attributes: {
    name: string;
    email: string;
    locale: string;
    phone: string;
    timezone: string;
  };
  relationships?: {
    userroles: RecordRelationship;
    usertasks: RecordRelationship;
    userprojects: RecordRelationship;
  };
};

export default User;  