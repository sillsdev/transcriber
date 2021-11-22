import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface Discussion extends BaseModel {
  attributes: {
    subject: string;
    segments: string;
    resolved: boolean;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    mediafile: RecordRelationship;
    role: RecordRelationship;
    user: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}
export default Discussion;
