import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';
export interface OrgKeyterm extends BaseModel {
  attributes: {
    term: string;
    gloss: string;
    definition: string;
    category: string;
    offlineid: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    organization: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export default OrgKeyterm;
