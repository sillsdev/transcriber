import { Record, RecordRelationship } from '@orbit/data';

export interface Group extends Record {
    attributes: {
      state: string;
      sequencenum: string;
    };
    relationships?: {
    };
  };
export default Group;
