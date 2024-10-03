import { UninitializedRecord } from '@orbit/records';

export interface VwBiblebrainlanguage extends UninitializedRecord {
  attributes: {
    iso: string;
    languagename: string;
    timing: boolean;
    nt: boolean;
    ot: boolean;
  };
}
export default VwBiblebrainlanguage;
