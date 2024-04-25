import { InitializedRecord } from '@orbit/records';

interface ChangeList {
  type: string;
  ids: number[];
}
export interface DataChange extends InitializedRecord {
  attributes: {
    startnext: number;
    querydate: Date;
    changes: ChangeList[];
    deleted: ChangeList[];
  };
}
export default DataChange;
