import { IwfKind, IWorkflow } from '../../model';

interface MyWorkflow extends IWorkflow {
  [key: string]: any;
}

export const workflowSheet = (workflow: IWorkflow[], cols: string[]) => {
  const results = Array<Array<any>>();
  workflow
    .filter((r) => !r.deleted)
    .forEach((r: MyWorkflow) => {
      const hi = r.kind === IwfKind.Section ? 2 : 99;
      const lo = r.kind === IwfKind.Passage ? 1 : -1;
      const line = Array<any>();
      cols.forEach((c, i) => {
        const value = i > lo && i < hi ? r[c] || '' : '';
        line.push(value);
      });
      results.push(line);
    });
  return results;
};
