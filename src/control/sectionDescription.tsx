import React from 'react';
import { Section } from '../model';
import { Box, Typography } from '@mui/material';
import { sectionNumber } from '../crud';
import useLocalStorageState from '../utils/useLocalStorageState';

interface IProps {
  section: Section;
}

export const SectionDescription = ({ section }: IProps) => {
  const [sectionMap] = useLocalStorageState(
    'sectionMap',
    new Map<number, string>()
  );
  const name =
    section && section.attributes && section.attributes.name
      ? section.attributes.name
      : '';

  return (
    <Box id="SectionDescription" sx={{ display: 'flex', flexDirection: 'row' }}>
      <Typography sx={{ width: '2em' }}>
        {sectionNumber(section, sectionMap) + '\u00A0\u00A0'}
      </Typography>
      <Typography sx={{ whiteSpace: 'normal' }}>{name}</Typography>
    </Box>
  );
};

export const SectionDescriptionCompare = (a: any, b: any) => {
  if (
    a.props.section.attributes.sequencenum ===
    b.props.section.attributes.sequencenum
  )
    return 0;
  return a.props.section.attributes.sequencenum <
    b.props.section.attributes.sequencenum
    ? -1
    : 1;
};
