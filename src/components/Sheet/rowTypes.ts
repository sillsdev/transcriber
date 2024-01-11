import { ISheet, SheetLevel } from '../../model';
import { PassageTypeEnum } from '../../model/passageType';
import { isPassageRow, isSectionRow } from './isSectionPassage';

export const rowTypes = (rowInfo: ISheet[]) => {
  const isSectionType = (i: number) =>
    i >= 0 && i < rowInfo.length ? isSectionRow(rowInfo[i]) : false;
  const isSectionHead = (i: number) =>
    isSectionType(i) ? rowInfo[i].level === SheetLevel.Section : false;
  const isPassageType = (i: number) =>
    i >= 0 && i < rowInfo.length ? isPassageRow(rowInfo[i]) : false;
  const isVerseRange = (i: number) =>
    isPassageType(i)
      ? rowInfo[i].passageType === PassageTypeEnum.PASSAGE
      : false;
  const isPassageOrNote = (i: number) =>
    isPassageType(i) &&
    [PassageTypeEnum.PASSAGE, PassageTypeEnum.NOTE].includes(
      rowInfo[i]?.passageType
    );
  const firstInSection = (i: number) => {
    if (!isPassageOrNote(i)) return false;
    while (--i >= 0 && !isSectionType(i)) {
      if (isPassageOrNote(i)) return false;
    }
    return true;
  };
  const isBook = (i: number) =>
    i >= 0 && rowInfo[i]?.passageType === PassageTypeEnum.BOOK;

  const isAltBook = (i: number) =>
    i >= 0 && rowInfo[i]?.passageType === PassageTypeEnum.ALTBOOK;

  const isMovement = (i: number) =>
    i >= 0 && i < rowInfo.length && rowInfo[i].level === SheetLevel.Movement;
  const firstSection = (i: number) => {
    while (i >= 0 && !isSectionType(i)) i--;
    while (
      --i >= 0 &&
      (!isSectionType(i) || isBook(i) || isAltBook(i) || isMovement(i))
    ) {}
    return i === -1;
  };
  const inSection = (i: number) => {
    while (--i >= 0 && !isSectionType(i)) {}
    return isSectionHead(i);
  };
  const lastSection = (i: number) => {
    while (++i < rowInfo.length && !isSectionType(i)) {}
    return i === rowInfo.length;
  };
  const isNote = (i: number) =>
    i >= 0 && rowInfo[i]?.passageType === PassageTypeEnum.NOTE;

  const isChapter = (i: number) =>
    i >= 0 &&
    i < rowInfo.length &&
    rowInfo[i]?.passageType === PassageTypeEnum.CHAPTERNUMBER;

  return {
    isSectionType,
    isSectionHead,
    inSection,
    isPassageType,
    isVerseRange,
    firstInSection,
    isBook,
    isAltBook,
    isMovement,
    isNote,
    isChapter,
    firstSection,
    lastSection,
  };
};
