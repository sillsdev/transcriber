import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface ArtifactCategory extends BaseModel {
  attributes: {
    categoryname: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    lastModifiedByUser: RecordRelationship;
  };
}

export default ArtifactCategory;
