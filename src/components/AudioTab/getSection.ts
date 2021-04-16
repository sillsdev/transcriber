import { Section } from '../../model';
import { sectionDescription } from '../../crud';

export const getSection = (section: Section[]) => {
  if (section.length === 0) return '';
  return sectionDescription(section[0]);
};
