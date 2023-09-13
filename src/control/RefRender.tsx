import { PassageTypeEnum } from '../model/passageType';
import {
  BookIcon,
  ChapterNumberIcon,
  AltBookIcon,
  NoteIcon,
  TitleIcon,
  MovementIcon,
} from './PlanIcons';

export const passageTypeFromRef = (ref?: string) => {
  if (!ref) return PassageTypeEnum.PASSAGE;
  var arr = Object.values(PassageTypeEnum).filter((v) => ref.startsWith(v));
  if (arr.length > 0) return arr[0];
  return PassageTypeEnum.PASSAGE;
};

export const isPassageTypeRecord = (ref?: string) =>
  passageTypeFromRef(ref) !== PassageTypeEnum.PASSAGE &&
  passageTypeFromRef(ref) !== PassageTypeEnum.NOTE;

const typeAndArg = (val: string, len: number, icon: JSX.Element) =>
  val.length > len + 1 ? (
    <>
      {icon}
      {`\u00A0`}
      {val.substring(len)}
    </>
  ) : (
    icon
  );

export const refRender = (value: any) => {
  const pt = passageTypeFromRef(value);
  switch (pt) {
    case PassageTypeEnum.MOVEMENT:
      return MovementIcon;
    case PassageTypeEnum.CHAPTERNUMBER:
      return typeAndArg(
        value.toString(),
        PassageTypeEnum.CHAPTERNUMBER.length,
        ChapterNumberIcon
      );
    case PassageTypeEnum.TITLE:
      return TitleIcon;
    case PassageTypeEnum.BOOK:
      return BookIcon;
    case PassageTypeEnum.ALTBOOK:
      return AltBookIcon;
    case PassageTypeEnum.NOTE:
      return typeAndArg(
        value.toString(),
        PassageTypeEnum.NOTE.length,
        NoteIcon
      );
    default:
      return value;
  }
};
