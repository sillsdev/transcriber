import { InitializedRecord, UninitializedRecord } from '@orbit/records';

export interface SectionPassage extends UninitializedRecord {
  attributes: {
    data: string;
    planId: number;
    uuid: string;
  };
}

export type SectionPassageD = SectionPassage & InitializedRecord;

export default SectionPassage;
