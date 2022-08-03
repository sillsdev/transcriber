import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface Comment extends BaseModel {
  attributes: {
    commentText: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
    offlineId: string;
    offlineDiscussionId: string;
    offlineMediafileId: string;
    visible: string; //jsonb
  };
  relationships?: {
    mediafile: RecordRelationship;
    discussion: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}
export default Comment;
