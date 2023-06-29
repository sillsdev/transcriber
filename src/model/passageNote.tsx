import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface PassageNote extends BaseModel {
  attributes: {
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    passage: RecordRelationship;
    noteSection: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}
export default PassageNote;
