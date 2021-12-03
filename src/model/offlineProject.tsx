import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface OfflineProject extends BaseModel {
  attributes: {
    computerfp: string;
    snapshotDate: string; //data date
    startNext: number;
    offlineAvailable: boolean;
    exportedDate: string;
    fileDownloadDate: string; //last time files downloaded
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    project: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}
export default OfflineProject;
