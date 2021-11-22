import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface Comment extends BaseModel {
  attributes: {
    commenttext: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    mediafile: RecordRelationship;
    discussion: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}
export default Comment;
