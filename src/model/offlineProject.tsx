import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface OfflineProject extends BaseModel {
  attributes: {
    computerfp: string;
    snapshotDate: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    project: RecordRelationship;
  };
}
export default OfflineProject;
