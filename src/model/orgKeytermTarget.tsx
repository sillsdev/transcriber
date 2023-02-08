import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';
export interface OrgKeytermTarget extends BaseModel {
  attributes: {
    term: string;
    offlineid: string;
    offlineMediafileid: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    organization: RecordRelationship;
    mediafile: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}
export default OrgKeytermTarget;
