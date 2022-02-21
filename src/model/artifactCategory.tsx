import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface ArtifactCategory extends BaseModel {
  attributes: {
    categoryname: string;
    discussion: boolean;
    resource: boolean;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    organization: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export default ArtifactCategory;
