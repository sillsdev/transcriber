import { InitializedRecord } from '@orbit/records';

export interface OrgData extends InitializedRecord {
  attributes: {
    json: string;
    startnext: number;
  };
}
export default OrgData;
