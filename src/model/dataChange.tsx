import { Record } from '@orbit/data';

interface ChangeList {
  type: string;
  ids: number[];
}
export interface DataChange extends Record {
  attributes: {
    querydate: Date;
    changes: ChangeList[];
    deleted: ChangeList[];
  };
}
export default DataChange;
