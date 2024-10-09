import { UninitializedRecord } from '@orbit/records';

export interface VwBiblebrainlanguage extends UninitializedRecord {
  attributes: {
    iso: string;
    languageName: string;
    nt: boolean;
    ot: boolean;
    ntTiming: boolean;
    otTiming: boolean;
  };
}
export default VwBiblebrainlanguage;
