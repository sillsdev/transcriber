import { IwfKind, IWorkflow } from '../../model';

interface MyWorkflow extends IWorkflow {
  [key: string]: any;
}

const getFilteredSection = (
  section: number,
  filtered: IWorkflow[],
  unfiltered: IWorkflow[]
) => {
  var totalPassages =
    unfiltered.filter((w) => !w.deleted && w.sectionSeq === section).length - 1;
  var showingPassages =
    filtered.filter((w) => w.sectionSeq === section).length - 1;
  return showingPassages < totalPassages
    ? '(' + showingPassages + '/' + totalPassages + ')'
    : '';
};
export const workflowSheet = (
  filtered: IWorkflow[],
  cols: string[],
  unfiltered: IWorkflow[]
) => {
  const results = Array<Array<any>>();
  filtered.forEach((r: MyWorkflow) => {
    const hi = r.kind === IwfKind.Section ? 2 : 99;
    const lo = r.kind === IwfKind.Passage ? 1 : -1;
    const line = Array<any>();
    cols.forEach((c, i) => {
      var value;
      if (r.kind === IwfKind.Section && c === 'passageSeq')
        value = getFilteredSection(r['sectionSeq'], filtered, unfiltered);
      else value = i > lo && i < hi ? r[c] || '' : '';
      line.push(value);
    });
    results.push(line);
  });
  return results;
};
