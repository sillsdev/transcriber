import { Record } from '@orbit/data';

export interface ProjData extends Record {
  attributes: {
    json: string;
    startnext: number;
    projectId: number;
    snapshotdate: string;
  };
}
export default ProjData;
