import { FC, memo } from 'react';
import { PassageTypeEnum } from '../model/passageType';
import {
  BookIcon,
  ChapterNumberIcon,
  AltBookIcon,
  NoteIcon,
  MovementIcon,
} from './PlanIcons';
import { Typography } from '@mui/material';

/**
 * Returns the passage type corresponding to the provided reference value.
 * If the reference value is not provided or the `flat` parameter is set to `true`,
 * it returns the default passage type 'PASSAGE'.
 *
 * @param ref - A string representing a reference value.
 * @param flat - An optional boolean indicating whether the reference is coming
 * from a flat project.
 * @returns The passage type corresponding to the provided reference value. If the reference value is not provided
 * or the `flat` parameter is set to `true`, it returns the default passage type 'PASSAGE'.
 */
interface PtMap {
  [key: string]: PassageTypeEnum;
}
const typeMap: PtMap = {
  [PassageTypeEnum.MOVEMENT]: PassageTypeEnum.MOVEMENT,
  [PassageTypeEnum.CHAPTERNUMBER]: PassageTypeEnum.CHAPTERNUMBER,
  [PassageTypeEnum.BOOK]: PassageTypeEnum.BOOK,
  [PassageTypeEnum.ALTBOOK]: PassageTypeEnum.ALTBOOK,
  [PassageTypeEnum.NOTE]: PassageTypeEnum.NOTE,
  [PassageTypeEnum.PASSAGE]: PassageTypeEnum.PASSAGE,
};

export const passageTypeFromRef = (
  ref?: string,
  flat?: boolean
): PassageTypeEnum => {
  // If the `flat` parameter is `true` or the `ref` parameter is not provided, return the default passage type 'PASSAGE'.
  if (flat || !ref) {
    return PassageTypeEnum.PASSAGE;
  }

  // Find token at at beginning of reference.
  const refMatch = /^[A-Z]+/.exec(ref);
  if (!refMatch) {
    return PassageTypeEnum.PASSAGE;
  }
  const firstElement = refMatch[0];

  // Check if the first element exists in the `typeMap` object.
  if (typeMap.hasOwnProperty(firstElement)) {
    // If it exists, return the corresponding passage type.
    return typeMap[firstElement];
  }

  // If it doesn't exist, return the default passage type 'PASSAGE'.
  return PassageTypeEnum.PASSAGE;
};

/**
 * Determines whether a given reference string corresponds to a passage type
 * which should just be recorded or not.
 *
 * @param ref - An optional string representing a reference.
 * @param flat - An optional boolean indicating whether the reference is coming
 * from a flat project.
 * @returns A boolean value indicating whether the given reference corresponds
 * to a passage type that will not follow the full workflow but rather just be
 * recorded.
 */
export const isPublishingTitle = (ref?: string, flat?: boolean): boolean => {
  const passageType = passageTypeFromRef(ref, flat);
  return (
    passageType !== PassageTypeEnum.PASSAGE &&
    passageType !== PassageTypeEnum.NOTE
  );
};

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
 * @param Icon - The icon component to be rendered.
 * @returns The rendered output, which includes the `icon` parameter, a
 * non-breaking space character, and a substring of the `value` parameter.
 */
interface AtProps {
  value: any;
  type: PassageTypeEnum;
  Icon: JSX.Element;
}

const ArgType: FC<AtProps> = memo(({ value, type, Icon }: AtProps) => {
  const len = type.length;
  const val = String(value);
  if (val.length <= len + 1) {
    return Icon;
  }
  return (
    <>
      {Icon}
      {'\u00A0'}
      {val.substring(len + 1)}
    </>
  );
});

/**
 * Determines the passage type based on the input value and returns the
 * corresponding icon component.
 *
 * @param value - The value used to determine the passage type.
 * @param flat - A flag indicating whether the value should be treated as a flat passage.
 * @returns The corresponding icon component based on the passage type.
 */
interface IPtMap {
  [key: string]: JSX.Element;
}
const passageTypeMap: IPtMap = {
  [PassageTypeEnum.MOVEMENT]: MovementIcon,
  [PassageTypeEnum.CHAPTERNUMBER]: ChapterNumberIcon,
  [PassageTypeEnum.BOOK]: BookIcon,
  [PassageTypeEnum.ALTBOOK]: AltBookIcon,
};
interface IProps {
  value: string;
  flat: boolean;
}

export const RefRender: FC<IProps> = memo(({ value, flat }: IProps) => {
  const pt = passageTypeFromRef(value, flat);
  if (pt === PassageTypeEnum.NOTE) {
    return <ArgType value={value} type={pt} Icon={NoteIcon} />;
  } else if (pt === PassageTypeEnum.CHAPTERNUMBER)
    return <ArgType value={value} type={pt} Icon={ChapterNumberIcon} />;
  else
    return (
      passageTypeMap[pt] ?? (
        <Typography
          component={'span'}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '200px',
          }}
        >
          {value}
        </Typography>
      )
    );
});
