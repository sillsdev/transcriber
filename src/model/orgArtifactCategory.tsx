import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface OrgArtifactCategory extends BaseModel {
  attributes: {
    categoryname: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    organization: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export default OrgArtifactCategory;
