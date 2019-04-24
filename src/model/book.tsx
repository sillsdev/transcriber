import TableRelationship from './relationsihp';

export interface Book {
    type: string;
    id: string;
    keys?: {
      remoteId?: string;
    };
    attributes: {
      name: string;
      bookTypeId: number;
    };
    relationships: {
      type: TableRelationship;
      sets: TableRelationship;
    };
  };
export default Book;
