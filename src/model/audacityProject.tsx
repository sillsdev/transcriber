import { RecordRelationship } from '@orbit/data';
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
export default AudacityProject;
