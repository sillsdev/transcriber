import { RecordRelationship } from '@orbit/data';
import { ActivityStates } from '.';
import { BaseModel } from './baseModel';

export interface PassageStateChange extends BaseModel {
  attributes: {
    state: ActivityStates;
    comments: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    passage: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}
export default PassageStateChange;
