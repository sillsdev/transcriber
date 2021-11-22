import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface ArtifactType extends BaseModel {
  attributes: {
    typename: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    lastModifiedByUser: RecordRelationship;
  };
}

export default ArtifactType;
