import { Record } from '@orbit/data';

export interface ProjData extends Record {
  attributes: {
    json: string;
    startnext: number;
    projectid: number;
  };
}
export default ProjData;
