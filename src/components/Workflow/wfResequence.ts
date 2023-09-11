import { IWorkflow, IwfKind, WorkflowLevel } from '../../model';
import { isSectionRow, isPassageRow } from '.';
import { currentDateTime } from '../../utils';
import { PassageTypeEnum } from '../../model/passageType';

export const nextNum = (
  lastNum: number,
  passageType: PassageTypeEnum | undefined
) => {
  if (!passageType || passageType === PassageTypeEnum.PASSAGE)
    return Math.floor(lastNum + 1);
  else return lastNum + 0.01;
};
export const wfResequence = (wf: IWorkflow[], sec = 1) => {
  const updatedAt = currentDateTime();
  let change = false;
  let pas = 0;
  sec -= 1;
  for (let i = 0; i < wf.length; i += 1) {
    let cur = wf[i];
    if (cur.deleted) continue;
    if (isSectionRow(cur)) {
      pas = cur.kind === IwfKind.Section ? 0 : 1;
      if (cur.sectionSeq > 0) {
        sec = nextNum(
          sec,
          cur.passageType ??
            (cur.level === WorkflowLevel.Movement
              ? PassageTypeEnum.MOVEMENT
              : PassageTypeEnum.PASSAGE)
        );
        if (cur.sectionSeq !== sec) {
          change = true;
          cur = { ...cur, sectionSeq: sec, sectionUpdated: updatedAt };
        }
        if (cur.passageSeq !== pas) {
          change = true;
          cur = { ...cur, passageSeq: pas, passageUpdated: updatedAt };
        }
      }
    }
    if (isPassageRow(cur)) {
      pas = nextNum(pas, cur.passageType);
      if (cur.passageSeq !== pas) {
        change = true;
        cur = { ...cur, passageSeq: pas, passageUpdated: updatedAt };
      }
      if (cur.sectionSeq !== sec) {
        change = true;
        cur = { ...cur, sectionSeq: sec, sectionUpdated: updatedAt };
      }
    }
    wf[i] = cur;
  }
  return change ? [...wf] : wf;
};

export const wfResequencePassages = (
  wf: IWorkflow[],
  sectionIndex: number,
  flat: boolean
) => {
  const updatedAt = currentDateTime();
  let pas = 0;
  let change = false;
  for (
    let i = sectionIndex + (flat ? 0 : 1);
    i < wf.length && isPassageRow(wf[i]);
    i += 1
  ) {
    if (wf[i].deleted) continue;
    pas = nextNum(pas, wf[i].passageType);
    if (wf[i].passageSeq !== pas) {
      change = true;
      wf[i] = { ...wf[i], passageSeq: pas, passageUpdated: updatedAt };
    }
  }
  return change ? [...wf] : wf;
};
