import { ISheet, IwsKind } from '../../model';

export const isSectionRow = (row: ISheet) =>
  row?.kind === IwsKind.Section || row?.kind === IwsKind.SectionPassage;

export const isPassageRow = (row: ISheet) =>
  row?.kind === IwsKind.Passage || row?.kind === IwsKind.SectionPassage;
