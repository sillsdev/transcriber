import { InitializedRecord, RecordRelationship } from '@orbit/records';
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

export type SectionResourceUserD = SectionResourceUser & InitializedRecord;

export default SectionResourceUser;
