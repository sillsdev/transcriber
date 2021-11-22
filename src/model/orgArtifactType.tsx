import { RecordRelationship } from '@orbit/data';
import { ArtifactType } from '.';

export interface OrgArtifactType extends ArtifactType {
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
