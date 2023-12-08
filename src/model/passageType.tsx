import { InitializedRecord, UninitializedRecord } from '@orbit/records';

export interface PassageType extends UninitializedRecord {
  attributes: {
    usfm: string;
    title: string;
    abbrev: string;
    defaultOrder: number;
  };
}

export enum PassageTypeEnum {
  BOOK = 'BOOK',
  CHAPTERNUMBER = 'CHNUM',
  ALTBOOK = 'ALTBK',
  NOTE = 'NOTE',
  MOVEMENT = 'MOVE',
  PASSAGE = 'PASS',
}

export type PassageTypeD = PassageType & InitializedRecord;

export default PassageType;
