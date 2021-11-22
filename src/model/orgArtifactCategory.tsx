import { RecordRelationship } from '@orbit/data';
import { ArtifactCategory } from '.';

export interface OrgArtifactCategory extends ArtifactCategory {
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
