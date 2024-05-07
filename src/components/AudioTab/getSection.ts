import { Section } from '../../model';
import { sectionDescription } from '../../crud/section';

export const getSection = (
  section: Section[],
  sectionMap?: Map<number, string>
) => {
  if (section.length === 0) return '';
  return sectionDescription(section[0], sectionMap);
};
