import { UninitializedRecord } from '@orbit/records';

export interface VwChecksum extends UninitializedRecord {
  attributes: {
    name: string;
    projectId: number;
    checksum: number;
  };
}
export default VwChecksum;
