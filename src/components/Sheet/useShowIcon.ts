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
    isPassage,
    isSection,
    isMovement,
    isInMovement,
    isBook,
    firstVernacularInSection,
    firstSection,
    lastSection,
  } = rowTypes(rowInfo);

  return (filtered: boolean, offline: boolean, rowIndex: number) =>
    (icon: ExtraIcon) => {
      const extraMap: IExtraMap = {
        [ExtraIcon.Publish]:
          !readonly &&
          !offline &&
          !inlinePassages &&
          rowInfo.length > 0 &&
          isSection(rowIndex) &&
          !isBook(rowIndex) &&
          !isMovement(rowIndex),
        [ExtraIcon.Note]: !readonly && !offline && !filtered && !inlinePassages,
        [ExtraIcon.PassageBelow]:
          !readonly &&
          !filtered &&
          !inlinePassages &&
          !isInMovement(rowIndex) &&
          !isBook(rowIndex),
        [ExtraIcon.MovementAbove]:
          !readonly &&
          !offline &&
          !filtered &&
          !inlinePassages &&
          rowInfo.length > 0 &&
          isSection(rowIndex) &&
          !isBook(rowIndex),
        [ExtraIcon.SectionAbove]:
          !readonly &&
          !filtered &&
          rowInfo.length > 0 &&
          isSection(rowIndex) &&
          !isBook(rowIndex),
        [ExtraIcon.SectionDown]:
          !readonly &&
          !filtered &&
          isSection(rowIndex) &&
          !isBook(rowIndex) &&
          !lastSection(rowIndex),
        [ExtraIcon.SectionUp]:
          !readonly &&
          !filtered &&
          rowIndex > 1 &&
          isSection(rowIndex) &&
          !isBook(rowIndex) &&
          !firstSection(rowIndex),
        [ExtraIcon.PassageDown]:
          !readonly &&
          !filtered &&
          !inlinePassages &&
          isPassage(rowIndex) &&
          !isBook(rowIndex) &&
          !isSection(rowIndex + 1) &&
          rowIndex < rowInfo.length - 1,
        [ExtraIcon.PassageToNext]:
          !readonly &&
          !filtered &&
          !inlinePassages &&
          isPassage(rowIndex) &&
          !isBook(rowIndex) &&
          isSection(rowIndex + 1),
        [ExtraIcon.PassageUp]:
          !readonly &&
          !filtered &&
          !inlinePassages &&
          rowIndex > 1 &&
          isPassage(rowIndex) &&
          !isBook(rowIndex) &&
          !isSection(rowIndex - 1),
        [ExtraIcon.PassageToPrev]:
          !readonly &&
          !filtered &&
          !inlinePassages &&
          rowIndex > 1 &&
          isPassage(rowIndex) &&
          !isBook(rowIndex) &&
          firstVernacularInSection(rowIndex),
        [ExtraIcon.PassageEnd]: !filtered && rowIndex !== rowInfo.length - 1,
        [ExtraIcon.PassageLast]: !filtered && isSection(rowIndex),
        [ExtraIcon.SectionEnd]: !filtered,
        [ExtraIcon.Publishing]:
          !hidePublishing &&
          !readonly &&
          !offline &&
          !filtered &&
          !inlinePassages,
      };
      return extraMap[icon];
    };
};
