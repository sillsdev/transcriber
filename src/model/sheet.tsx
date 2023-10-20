import { RecordIdentity } from '@orbit/data';
import { PassageTypeEnum } from './passageType';
import Passage from './passage';

export enum IwsKind {
  Section,
  Passage,
  SectionPassage,
  Task,
  SubTask,
}
export enum IMediaShare {
  Latest,
  OldVersionOnly,
  None,
  NotPublic,
}
export enum SheetLevel {
  Book = 1,
  Movement,
  Section,
  SubSection,
  Passage,
}
export interface ISheet {
  level: SheetLevel; //currently not used anywhere
  kind: IwsKind;
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
  passage?: Passage;
  sharedResourceId?: RecordIdentity;
  passageType: PassageTypeEnum;
  passageUpdated?: string;
  mediaId?: RecordIdentity;
  mediaShared: IMediaShare;
  step?: string;
  stepId?: string;
  deleted: boolean;
  filtered: boolean;
  discussionCount: number;
  published: boolean;
  graphicUri?: string;
  graphicRights?: string;
  titleMediaId?: RecordIdentity;
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
