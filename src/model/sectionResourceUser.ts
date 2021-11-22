import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface SectionResourceUser extends BaseModel {
  attributes: {
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    sectionresource: RecordRelationship;
    user: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}
export default SectionResourceUser;
