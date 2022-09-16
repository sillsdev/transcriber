import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface IntellectualProperty extends BaseModel {
  attributes: {
    rightsHolder: string; //performedBy in mediafile
    notes: string;
    offlineId: string;
    offlineMediafileId: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    organization: RecordRelationship;
    releaseMediafile: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}
export default IntellectualProperty;
