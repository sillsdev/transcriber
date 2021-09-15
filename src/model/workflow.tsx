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
  sequence: number;
  title?: string;
  sectionId?: RecordIdentity;
  sectionUpdated?: string;
  passageId?: RecordIdentity;
  passageUpdated?: string;
  book?: string;
  reference?: string;
  comment?: string;
  transcriber?: RecordIdentity;
  editor?: RecordIdentity;
  deleted: boolean;
}
