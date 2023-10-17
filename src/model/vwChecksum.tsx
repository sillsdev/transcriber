import { Record } from '@orbit/data';

export interface VwChecksum extends Record {
  attributes: {
    name: string;
    projectId: number;
    checksum: number;
  };
}
export default VwChecksum;
