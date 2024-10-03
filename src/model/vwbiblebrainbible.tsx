import { UninitializedRecord } from '@orbit/records';

export interface VwBiblebrainbible extends UninitializedRecord {
  attributes: {
    bibleid: string;
    biblename: string;
    pubdate: string;
    iso: string;
    timing: boolean;
    nt: boolean;
    ot: boolean;
  };
}
export default VwBiblebrainbible;
