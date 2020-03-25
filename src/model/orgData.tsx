import { Record } from '@orbit/data';

export interface OrgData extends Record {
  attributes: {
    json: string;
    startnext: number;
  };
}
export default OrgData;
