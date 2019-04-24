import TableRelationship from './relationsihp';

export interface BookType {
    type: string;
    id: string;
    keys?: {
      remoteId?: string;
    };
    attributes: {
      name: string;
      description: string;
    };
    relationships: {
      books: TableRelationship;
    };
  };
export default BookType;
