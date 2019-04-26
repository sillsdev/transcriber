import { Record, RecordRelationship } from '@orbit/data';

export interface BookType extends Record {
    attributes: {
      name: string;
      description: string;
    };
    relationships?: {
      books: RecordRelationship;
    };
  };
export default BookType;
