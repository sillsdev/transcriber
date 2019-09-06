import { Record } from '@orbit/data';

export interface ActivityState extends Record {
  attributes: {
    state: string;
    sequencenum: string;
  };
  relationships?: {};
}
export default ActivityState;
