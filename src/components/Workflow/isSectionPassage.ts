import { IWorkflow, IwfKind } from '../../model';

export const isSectionRow = (row: IWorkflow) =>
  row.kind === IwfKind.Section || row.kind === IwfKind.SectionPassage;

export const isPassageRow = (row: IWorkflow) =>
  row.kind === IwfKind.Passage || row.kind === IwfKind.SectionPassage;
