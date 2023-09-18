import { PassageTypeEnum } from '../model/passageType';
import {
  BookIcon,
  ChapterNumberIcon,
  AltBookIcon,
  NoteIcon,
  TitleIcon,
  MovementIcon,
} from './PlanIcons';

/**
 * Returns the passage type corresponding to the provided reference value.
 * If the reference value is not provided, the default passage type 'PASSAGE'
 * is returned.
 *
 * @param ref - A string representing a reference value.
 * @returns The passage type corresponding to the provided reference value. If
 * the reference value is not provided, the default passage type 'PASSAGE' is
 * returned.
 */
export const passageTypeFromRef = (
  ref: string | undefined,
  flat: boolean
): PassageTypeEnum => {
  if (flat || !ref) {
    return PassageTypeEnum.PASSAGE;
  }

  const matchingValue = Object.values(PassageTypeEnum).find((value) =>
    ref.startsWith(value)
  );

  return matchingValue || PassageTypeEnum.PASSAGE;
};

/**
 * Determines whether a given reference string corresponds to a passage type
 * which should just be recorded or not.
 *
 * @param ref - An optional string representing a reference.
 * @returns A boolean value indicating whether the given reference corresponds
 * to a passage type that will not follow the full workflow but rather just be
 * recorded.
 */
export const isPublishingTitle = (
  ref: string | undefined,
  flat: boolean
): boolean => {
  const passageType = passageTypeFromRef(ref, flat);
  return (
    passageType !== PassageTypeEnum.PASSAGE &&
    passageType !== PassageTypeEnum.NOTE
  );
};

interface AtProps {
  value: any;
  type: PassageTypeEnum;
  icon: JSX.Element;
}
/**
 * Renders a JSX element based on the provided parameters.
 * If the length of the `value` parameter is less than or equal to the length
 * of `type` plus one, it returns the `icon` parameter.
 * Otherwise, it returns a JSX element that includes the `icon` parameter, a
 * non-breaking space character, and a substring of the `value` parameter
 * starting from the length of `type`.
 *
 * @param value - The value to be rendered.
 * @param type - The type of the passage.
 * @param icon - The icon component to be rendered.
 * @returns The rendered output, which includes the `icon` parameter, a
 * non-breaking space character, and a substring of the `value` parameter.
 */
const ArgType = ({ value, type, icon }: AtProps) => {
  const len = type.length;
  const val = String(value);
  if (val.length <= len + 1) {
    return icon;
  }
  return (
    <>
      {icon}
      {'\u00A0'}
      {val.substring(len)}
    </>
  );
};

/**
 * Determines the passage type based on the input value and returns the
 * corresponding icon component.
 *
 * @param value - The value used to determine the passage type.
 * @returns The corresponding icon component based on the passage type.
 */
export const refRender = (value: any, flat: boolean) => {
  const pt = passageTypeFromRef(value, flat);

  switch (pt) {
    case PassageTypeEnum.MOVEMENT:
      return MovementIcon;
    case PassageTypeEnum.CHAPTERNUMBER:
      return <ArgType value={value} type={pt} icon={ChapterNumberIcon} />;
    case PassageTypeEnum.TITLE:
      return TitleIcon;
    case PassageTypeEnum.BOOK:
      return BookIcon;
    case PassageTypeEnum.ALTBOOK:
      return AltBookIcon;
    case PassageTypeEnum.NOTE:
      return <ArgType value={value} type={pt} icon={NoteIcon} />;
    default:
      return value;
  }
};
