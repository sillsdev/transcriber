import { IwsKind, ISheet, SheetLevel } from '../../model';

interface MyWorkflow extends ISheet {
  [key: string]: any;
}

const getFilteredSection = (
  section: number,
  filtered: ISheet[],
  unfiltered: ISheet[]
) => {
  var totalPassages =
    unfiltered.filter((w) => !w.deleted && w.sectionSeq === section).length - 1;
  var showingPassages =
    filtered.filter((w) => w.sectionSeq === section).length - 1;
  return showingPassages < totalPassages
    ? '(' + showingPassages + '/' + totalPassages + ')'
    : '';
};
export const workSheet = (
  filtered: ISheet[],
  cols: string[],
  unfiltered: ISheet[]
) => {
  const results = Array<Array<any>>();
  filtered.forEach((r: MyWorkflow) => {
    const hi = r.kind === IwsKind.Section ? 2 : 99;
    const lo = r.kind === IwsKind.Passage ? 1 : -1;
    const line = Array<any>();
    cols.forEach((c, i) => {
      var value;
      if (r.kind === IwsKind.Section && c === 'passageSeq')
        value = getFilteredSection(r['sectionSeq'], filtered, unfiltered);
      else if (
        r.kind === IwsKind.Section &&
        r.level === SheetLevel.Movement &&
        c === 'reference'
      )
        value = r[c];
      else value = i > lo && i < hi ? r[c] || '' : '';
      line.push(value);
    });
    results.push(line);
  });
  return results;
};
