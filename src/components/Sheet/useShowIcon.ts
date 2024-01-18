import { ExtraIcon } from '.';
import { rowTypes } from './rowTypes';
import { ISheet } from '../../model';

interface IExtraMap {
  [key: number]: boolean;
}

interface IProps {
  readonly: boolean;
  rowInfo: ISheet[];
  inlinePassages: boolean;
  hidePublishing: boolean;
}

export const useShowIcon = ({
  readonly,
  rowInfo,
  inlinePassages,
  hidePublishing,
}: IProps) => {
  const {
    isPassageType,
    isVerseRange,
    isSectionType,
    isSectionHead,
    inSection,
    isMovement,
    isNote,
    isChapter,
    isBook,
    firstInSection,
    firstSection,
    lastSection,
    isFirstMovement,
  } = rowTypes(rowInfo);

  return (filtered: boolean, offline: boolean, rowIndex: number) =>
    (icon: ExtraIcon) => {
      const extraMap: IExtraMap = {
        [ExtraIcon.Publish]:
          !inlinePassages && isSectionHead(rowIndex) && !hidePublishing,
        [ExtraIcon.Publishing]: !inlinePassages && !hidePublishing,
        [ExtraIcon.MovementAbove]:
          !inlinePassages &&
          (isSectionHead(rowIndex) || isMovement(rowIndex)) &&
          !hidePublishing,
        [ExtraIcon.SectionAbove]:
          !inlinePassages && (isSectionHead(rowIndex) || isMovement(rowIndex)),
        [ExtraIcon.SectionEnd]: true,
        [ExtraIcon.PassageBelow]:
          !inlinePassages &&
          (isSectionHead(rowIndex) || isPassageType(rowIndex)) &&
          inSection(rowIndex),
        [ExtraIcon.PassageLast]: !inlinePassages && isSectionHead(rowIndex),
        [ExtraIcon.PassageEnd]:
          !inlinePassages &&
          (isSectionHead(rowInfo.length - 1) ||
            isPassageType(rowInfo.length - 1)),
        [ExtraIcon.Note]:
          !inlinePassages &&
          !hidePublishing &&
          (isBook(rowIndex) ||
            isChapter(rowIndex) ||
            isMovement(rowIndex) ||
            isSectionHead(rowIndex) ||
            isVerseRange(rowIndex) ||
            isNote(rowIndex)),
        [ExtraIcon.SectionUp]:
          (isSectionHead(rowIndex) || isMovement(rowIndex)) &&
          !firstSection(rowIndex),
        [ExtraIcon.SectionDown]:
          (isSectionHead(rowIndex) || isMovement(rowIndex)) &&
          !lastSection(rowIndex),
        [ExtraIcon.PassageToPrev]:
          !inlinePassages &&
          firstInSection(rowIndex) &&
          !firstSection(rowIndex),
        [ExtraIcon.PassageUp]:
          !inlinePassages &&
          !firstInSection(rowIndex) &&
          (isVerseRange(rowIndex) || isNote(rowIndex)),
        [ExtraIcon.PassageDown]:
          !inlinePassages &&
          (isVerseRange(rowIndex) || isNote(rowIndex)) &&
          !isSectionType(rowIndex + 1) &&
          rowIndex < rowInfo.length - 1,
        [ExtraIcon.PassageToNext]:
          !inlinePassages &&
          (isVerseRange(rowIndex) || isNote(rowIndex)) &&
          (isSectionHead(rowIndex + 1) || isMovement(rowIndex + 1)),
        [ExtraIcon.FirstMovement]: isFirstMovement(rowIndex),
      };
      return !readonly && !offline && !filtered && extraMap[icon];
    };
};
