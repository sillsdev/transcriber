import { Record } from '@orbit/data';

export interface PassageType extends Record {
  attributes: {
    usfm: string;
    title: string;
    abbrev: string;
    defaultorder: number;
  };
}
export default PassageType;
