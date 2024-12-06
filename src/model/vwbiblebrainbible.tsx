import { UninitializedRecord } from '@orbit/records';

export interface VwBiblebrainbible extends UninitializedRecord {
  attributes: {
    bibleid: string;
    bibleName: string;
    pubdate: string;
    iso: string;
    nt: boolean;
    ot: boolean;
    ntTiming: boolean;
    otTiming: boolean;
  };
}
export default VwBiblebrainbible;
