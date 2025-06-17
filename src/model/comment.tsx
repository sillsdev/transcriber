import { InitializedRecord, RecordRelationship } from '@orbit/records';
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
    creatorUser: RecordRelationship;
  };
}

export type CommentD = Comment & InitializedRecord;

export default Comment;
