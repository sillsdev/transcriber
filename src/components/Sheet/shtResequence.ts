import { ISheet, IwsKind, SheetLevel } from '../../model';
import { isSectionRow, isPassageRow } from './isSectionPassage';
import { currentDateTime } from '../../utils/currentDateTime';
import { PassageTypeEnum } from '../../model/passageType';

export const nextNum = (
  lastNum: number,
  passageType: PassageTypeEnum | undefined
) => {
  if (!passageType || passageType === PassageTypeEnum.PASSAGE)
    return Math.floor(lastNum + 1);
  else {
    return Math.round((lastNum + 0.01) * 100) / 100;
  }
};

export const getMinSection = (ws: ISheet[]) => {
  if (!ws || ws.length === 0) return 1;
  let ms = ws.reduce((min, cur) =>
    isSectionRow(cur) &&
    cur.level >= 3 &&
    (min.level < 3 || cur.sectionSeq < min.sectionSeq)
      ? cur
      : min
  );
  return ms ? Math.max(1, ms.sectionSeq) : 1;
};

export const shtResequence = (ws: ISheet[], sec = 1) => {
  const updatedAt = currentDateTime();
  let change = false;
  let pas = 0;
  if (sec === 1) {
    sec = getMinSection(ws) - 1;
  }

  for (let i = 0; i < ws.length; i += 1) {
    let cur = ws[i];
    if (cur.deleted) continue;
    if (isSectionRow(cur)) {
      pas = cur.kind === IwsKind.Section ? 0 : 1;
      if (cur.sectionSeq > 0) {
        sec = nextNum(
          sec,
          cur.passageType ??
            (cur.level === SheetLevel.Movement
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
      if (cur.sectionSeq > 0 && cur.sectionSeq !== sec) {
        change = true;
        cur = { ...cur, sectionSeq: sec, sectionUpdated: updatedAt };
      }
    }
    ws[i] = cur;
  }
  return change ? [...ws] : ws;
};

export const wfResequencePassages = (
  ws: ISheet[],
  sectionIndex: number,
  flat: boolean
) => {
  const updatedAt = currentDateTime();
  let pas = 0;
  let change = false;
  for (
    let i = sectionIndex + (flat ? 0 : 1);
    i < ws.length && isPassageRow(ws[i]);
    i += 1
  ) {
    if (ws[i].deleted) continue;
    pas = nextNum(pas, ws[i].passageType);
    if (ws[i].passageSeq !== pas) {
      change = true;
      ws[i] = { ...ws[i], passageSeq: pas, passageUpdated: updatedAt };
    }
  }
  return change ? [...ws] : ws;
};
