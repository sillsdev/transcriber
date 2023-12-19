import { InitializedRecord, RecordRelationship } from '@orbit/records';
import { BaseModel } from './baseModel';

export interface ArtifactCategory extends BaseModel {
  attributes: {
    categoryname: string;
    discussion: boolean;
    resource: boolean;
    note: boolean;
    color: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    titleMediafile: RecordRelationship;
    organization: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export type ArtifactCategoryD = ArtifactCategory & InitializedRecord;

export default ArtifactCategory;
