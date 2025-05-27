import { ExtraIcon } from '.';
import { rowTypes } from './rowTypes';
import { ISheet } from '../../model';
import { useStepPermissions } from '../../utils/useStepPermission';
import { related } from '../../crud/related';

interface IExtraMap {
  [key: number]: boolean;
}

interface IProps {
  canEditSheet: boolean;
  canPublish: boolean;
  rowInfo: ISheet[];
  inlinePassages: boolean;
  hidePublishing: boolean;
}

export const useShowIcon = ({
  canEditSheet,
  canPublish,
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
    // isBook,
    isAltBook,
    firstInSection,
    firstSection,
    lastSection,
    isFirstMovement,
  } = rowTypes(rowInfo);
  const { canDoVernacular } = useStepPermissions();
  return (filtered: boolean, offline: boolean, rowIndex: number) =>
    (icon: ExtraIcon) => {
      const extraMap: IExtraMap = {
        //section publish
        [ExtraIcon.Publish]:
          !inlinePassages &&
          (isSectionHead(rowIndex) || isMovement(rowIndex)) &&
          !hidePublishing,
        [ExtraIcon.Publishing]:
          (canPublish || canEditSheet) && !inlinePassages && !hidePublishing, //update publishing under add section
        [ExtraIcon.MovementAbove]:
          (canPublish || canEditSheet) &&
          !inlinePassages &&
          (isSectionHead(rowIndex) || isMovement(rowIndex)) &&
          !hidePublishing,
        [ExtraIcon.SectionAbove]:
          canEditSheet && (isSectionHead(rowIndex) || isMovement(rowIndex)),
        [ExtraIcon.SectionEnd]: canEditSheet,
        [ExtraIcon.PassageBelow]:
          canEditSheet &&
          !inlinePassages &&
          (isSectionHead(rowIndex) ||
            (isPassageType(rowIndex) && inSection(rowIndex))),
        [ExtraIcon.PassageLast]:
          canEditSheet && !inlinePassages && isSectionHead(rowIndex),
        [ExtraIcon.PassageEnd]:
          canEditSheet &&
          !inlinePassages &&
          (isSectionHead(rowInfo.length - 1) ||
            isPassageType(rowInfo.length - 1)),
        [ExtraIcon.Note]:
          canEditSheet &&
          !inlinePassages &&
          !hidePublishing &&
          (isChapter(rowIndex) ||
            isMovement(rowIndex) ||
            isSectionHead(rowIndex) ||
            isVerseRange(rowIndex) ||
            isNote(rowIndex)),
        [ExtraIcon.SectionUp]:
          canEditSheet &&
          (isSectionHead(rowIndex) || isMovement(rowIndex)) &&
          !firstSection(rowIndex),
        [ExtraIcon.SectionDown]:
          canEditSheet &&
          (isSectionHead(rowIndex) || isMovement(rowIndex)) &&
          !lastSection(rowIndex),
        [ExtraIcon.PassageToPrev]:
          canEditSheet &&
          !inlinePassages &&
          firstInSection(rowIndex) &&
          //I can move a note into whatever is before the first section
          (!firstSection(rowIndex) || (isNote(rowIndex) && rowIndex > 1)),
        [ExtraIcon.PassageUp]:
          canEditSheet &&
          !inlinePassages &&
          !firstInSection(rowIndex) &&
          (isVerseRange(rowIndex) || isNote(rowIndex)),
        [ExtraIcon.PassageDown]:
          canEditSheet &&
          !inlinePassages &&
          (isVerseRange(rowIndex) || isNote(rowIndex)) &&
          !isSectionType(rowIndex + 1) &&
          rowIndex < rowInfo.length - 1,
        [ExtraIcon.PassageToNext]:
          canEditSheet &&
          !inlinePassages &&
          (isVerseRange(rowIndex) || isNote(rowIndex)) &&
          (isSectionHead(rowIndex + 1) ||
            isMovement(rowIndex + 1) ||
            isAltBook(rowIndex + 1)),
        [ExtraIcon.FirstMovement]: isFirstMovement(rowIndex),
        [ExtraIcon.VernacularRecord]:
          canDoVernacular(
            rowInfo[rowIndex]?.sectionId?.id ??
              related(rowInfo[rowIndex]?.passage, 'section') ??
              ''
          ) && isPassageType(rowIndex),
        [ExtraIcon.Delete]: canEditSheet,
      };
      return !offline && !filtered && extraMap[icon];
    };
};
