import { ISheet, SheetLevel } from '../../model';
import { PassageTypeEnum } from '../../model/passageType';
import { isPassageRow, isSectionRow } from './isSectionPassage';

export const rowTypes = (rowInfo: ISheet[]) => {
  const isSection = (i: number) =>
    i >= 0 && i < rowInfo.length ? isSectionRow(rowInfo[i]) : false;
  const isPassage = (i: number) =>
    i >= 0 && i < rowInfo.length ? isPassageRow(rowInfo[i]) : false;
  const firstVernacularInSection = (i: number) => {
    if (rowInfo[i].passageType !== PassageTypeEnum.PASSAGE) return false;
    while (--i >= 0 && !isSection(i)) {
      if (rowInfo[i].passageType === PassageTypeEnum.PASSAGE) return false;
    }
    return true;
  };
  const isBook = (i: number) =>
    i >= 0 &&
    i < rowInfo.length &&
    (rowInfo[i].level === SheetLevel.Book ||
      rowInfo[i].passageType === PassageTypeEnum.BOOK ||
      rowInfo[i].passageType === PassageTypeEnum.ALTBOOK);

  const isMovement = (i: number) =>
    i >= 0 && i < rowInfo.length && rowInfo[i].level === SheetLevel.Movement;

  const isInMovement = (i: number) => {
    if (
      i >= 0 &&
      i < rowInfo.length &&
      rowInfo[i].passageType === PassageTypeEnum.NOTE
    ) {
      var sec = i - 1;
      while (sec > 0 && !isSection(sec)) sec--;
      return isMovement(sec);
    }
    return false;
  };
  return {
    isSection,
    isPassage,
    firstVernacularInSection,
    isBook,
    isMovement,
    isInMovement,
  };
};
