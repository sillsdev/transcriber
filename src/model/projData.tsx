import { UninitializedRecord } from '@orbit/records';

export interface ProjData extends UninitializedRecord {
  attributes: {
    json: string;
    startnext: number;
    projectId: number;
    snapshotdate: string;
  };
}
export default ProjData;
