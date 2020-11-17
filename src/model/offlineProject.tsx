import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface OfflineProject extends BaseModel {
  attributes: {
    computerfp: string;
    snapshotDate: string;
    offlineAvailable: boolean;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    project: RecordRelationship;
  };
}
export default OfflineProject;
