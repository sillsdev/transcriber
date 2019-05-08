import { Record, RecordRelationship } from '@orbit/data';

export interface PlanType extends Record {
    attributes: {
      name: string;
      description: string;
    };
    relationships?: {
      plans: RecordRelationship;
    };
  };
export default PlanType;
