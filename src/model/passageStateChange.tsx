import { InitializedRecord, RecordRelationship } from '@orbit/records';
import { ActivityStates } from '.';
import { BaseModel } from './baseModel';

export interface PassageStateChange extends BaseModel {
  attributes: {
    state: ActivityStates;
    comments: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
    offlineId: string;
  };
  relationships?: {
    passage: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export type PassageStateChangeD = PassageStateChange & InitializedRecord;

export default PassageStateChange;
