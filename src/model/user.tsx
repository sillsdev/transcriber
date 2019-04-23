import TableRelationship from './relationsihp';

export interface User {
  type: string;
  id: string;
  attributes: {
    name: string;
    email: string;
    locale: string;
    phone: string;
    timezone: string;
  };
  relationships: {
    userroles: TableRelationship;
    usertasks: TableRelationship;
    userprojects: TableRelationship;
  };
};

export default User;  