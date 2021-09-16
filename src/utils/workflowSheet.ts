import { IWorkflow } from '../model';

interface MyWorkflow extends IWorkflow {
  [key: string]: any;
}

export const workflowSheet = (workflow: IWorkflow[], cols: string[]) => {
  const results = Array<Array<any>>();
  workflow
    .filter((r) => !r.deleted)
    .forEach((r: MyWorkflow) => {
      const line = Array<any>();
      cols.forEach((c: string) => {
        const value = r[c];
        line.push(value || '');
      });
      results.push(line);
    });
  return results;
};
