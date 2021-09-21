import { IWorkflow, IwfKind } from '../model';
import { isSectionRow, isPassageRow, currentDateTime } from '.';

export const wfResequence = (wf: IWorkflow[], sec = 1) => {
  const updatedAt = currentDateTime();
  let change = false;
  let pas = 0;
  sec -= 1;
  for (let i = 0; i < wf.length; i += 1) {
    let cur = wf[i];
    if (isSectionRow(cur)) {
      sec += 1;
      pas = cur.kind === IwfKind.Section ? 0 : 1;
      if (cur.sectionSeq !== sec) {
        change = true;
        cur = { ...cur, sectionSeq: sec, sectionUpdated: updatedAt };
      }
      if (cur.passageSeq !== pas) {
        change = true;
        cur = { ...cur, passageSeq: pas, passageUpdated: updatedAt };
      }
    }
    if (isPassageRow(cur)) {
      if (cur.passageSeq !== pas) {
        change = true;
        cur = { ...cur, passageSeq: pas, passageUpdated: updatedAt };
      }
      if (cur.sectionSeq !== sec) {
        change = true;
        cur = { ...cur, sectionSeq: sec, sectionUpdated: updatedAt };
      }
    }
    pas += 1;
    wf[i] = cur;
  }
  return change ? [...wf] : wf;
};

export const wfResequencePassages = (wf: IWorkflow[], sectionIndex: number) => {
  const updatedAt = currentDateTime();
  let pas = 1;
  let change = false;
  for (
    let i = sectionIndex + 1;
    i < wf.length && wf[i].kind === IwfKind.Passage;
    i += 1
  ) {
    if (wf[i].passageSeq !== pas) {
      change = true;
      wf[i] = { ...wf[i], passageSeq: pas, passageUpdated: updatedAt };
    }
    pas += 1;
  }
  return change ? [...wf] : wf;
};
