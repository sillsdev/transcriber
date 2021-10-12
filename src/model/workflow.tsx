import { RecordIdentity } from '@orbit/data';

export enum IwfKind {
  Section,
  Passage,
  SectionPassage,
  Task,
  SubTask,
}

export interface IWorkflow {
  level: number;
  kind: IwfKind;
  sectionSeq: number;
  title?: string;
  transcriber?: RecordIdentity;
  editor?: RecordIdentity;
  sectionId?: RecordIdentity;
  sectionUpdated?: string;
  passageSeq: number;
  book?: string;
  reference?: string;
  comment?: string;
  passageId?: RecordIdentity;
  passageUpdated?: string;
  mediaId?: RecordIdentity;
  deleted: boolean;
}

export const flatScrColNames = [
  'sectionSeq',
  'title',
  'book',
  'reference',
  'comment',
];
export const flatGenColNames = ['sectionSeq', 'title', 'reference', 'comment'];
export const levScrColNames = [
  'sectionSeq',
  'title',
  'passageSeq',
  'book',
  'reference',
  'comment',
];
export const levGenColNames = [
  'sectionSeq',
  'title',
  'passageSeq',
  'reference',
  'comment',
];
