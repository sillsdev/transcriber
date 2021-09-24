import {
  isSectionRow,
  isPassageRow,
  isSectionUpdated,
  isPassageUpdated,
} from '.';
import { IWorkflow } from '../../model';

export const wfNumChanges = (
  workflow: IWorkflow[],
  lastSaved: string | undefined
) =>
  workflow.reduce((prev, cur, i) => {
    let secChange = false;
    if (isSectionRow(cur) && isSectionUpdated(cur, lastSaved)) {
      secChange = true;
    }
    let passChanged = false;
    if (isPassageRow(cur) && isPassageUpdated(cur, lastSaved)) {
      passChanged = true;
    }
    return prev + (secChange ? 1 : 0) + (passChanged ? 1 : 0);
  }, 0);
