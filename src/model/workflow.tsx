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
