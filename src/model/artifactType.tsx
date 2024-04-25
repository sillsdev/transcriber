import { InitializedRecord, RecordRelationship } from '@orbit/records';
import { BaseModel } from './baseModel';

export interface ArtifactType extends BaseModel {
  attributes: {
    typename: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    organization: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export type ArtifactTypeD = ArtifactType & InitializedRecord;

export default ArtifactType;
