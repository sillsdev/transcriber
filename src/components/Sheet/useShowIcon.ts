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
  } = rowTypes(rowInfo);

  return (filtered: boolean, rowIndex: number) => (icon: ExtraIcon) => {
    const extraMap: IExtraMap = {
      [ExtraIcon.Publish]:
        !readonly &&
        !inlinePassages &&
        rowInfo.length > 0 &&
        isSection(rowIndex) &&
        !isBook(rowIndex) &&
        !isMovement(rowIndex),
      [ExtraIcon.Note]: !readonly && !filtered && !inlinePassages,
      [ExtraIcon.PassageBelow]:
        !readonly &&
        !filtered &&
        !inlinePassages &&
        !isInMovement(rowIndex) &&
        !isBook(rowIndex),
      [ExtraIcon.MovementAbove]:
        !readonly &&
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
        !hidePublishing && !readonly && !filtered && !inlinePassages,
    };
    return extraMap[icon];
  };
};
