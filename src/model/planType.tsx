import {
  InitializedRecord,
  RecordRelationship,
  UninitializedRecord,
} from '@orbit/records';

export interface PlanType extends UninitializedRecord {
  attributes: {
    name: string;
    description: string;
  };
  relationships?: {
    plans: RecordRelationship;
  };
}

export type PlanTypeD = PlanType & InitializedRecord;

export default PlanType;
