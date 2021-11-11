import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface OrgArtifactType extends BaseModel {
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

export default OrgArtifactType;
