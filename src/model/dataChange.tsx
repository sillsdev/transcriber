import { Record, RecordIdentity } from '@orbit/data';

export interface DataChange extends Record {
  attributes: {
    querydate: Date;
    changes: RecordIdentity[][];
    deleted: RecordIdentity[][];
  };
}
export default DataChange;
