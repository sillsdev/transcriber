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

interface AtProps {
  value: any;
  type: PassageTypeEnum;
  icon: JSX.Element;
}
const ArgType = ({ value, type, icon }: AtProps) => {
  const len = type.length;
  const val = value.toString();
  if (val.length <= len + 1) return icon;
  return (
    <>
      {icon}
      {`\u00A0`}
      {val.substring(len)}
    </>
  );
};

export const refRender = (value: any) => {
  const pt = passageTypeFromRef(value);
  switch (pt) {
    case PassageTypeEnum.MOVEMENT:
      return MovementIcon;
    case PassageTypeEnum.CHAPTERNUMBER:
      return <ArgType value type={pt} icon={ChapterNumberIcon} />;
    case PassageTypeEnum.TITLE:
      return TitleIcon;
    case PassageTypeEnum.BOOK:
      return BookIcon;
    case PassageTypeEnum.ALTBOOK:
      return AltBookIcon;
    case PassageTypeEnum.NOTE:
      return <ArgType value type={pt} icon={NoteIcon} />;
    default:
      return value;
  }
};
