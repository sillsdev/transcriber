import { InitializedRecord, RecordRelationship } from '@orbit/records';
import { BaseModel } from './baseModel';

export interface AudacityProject extends BaseModel {
  attributes: {
    audacityName: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    project: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export type AudacityProjectD = AudacityProject & InitializedRecord;

export default AudacityProject;
