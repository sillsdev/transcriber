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
  ALTBOOK = 'BKALT',
  NOTE = 'NOTE',
}
export const IsNoteType = (ref: string) => ref.startsWith(PassageTypeEnum.NOTE);
export const IsPublishingType = (ref: string) =>
  Object.values(PassageTypeEnum).includes(ref as PassageTypeEnum) ||
  IsNoteType(ref);

export const PassageTypeRecordOnly = (ref: string) =>
  IsPublishingType(ref) && !IsNoteType(ref);

export default PassageType;
