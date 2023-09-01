import { Record } from '@orbit/data';

export interface PassageType extends Record {
  attributes: {
    usfm: string;
    title: string;
    abbrev: string;
    defaultorder: number;
  };
}
export enum PassageTypeEnum {
  BOOK = 'BOOK',
  CHAPTERNUMBER = 'CHNUM',
  TITLE = 'TITLE',
  ALTBOOK = 'ALTBK',
  NOTE = 'NOTE',
}
export default PassageType;
