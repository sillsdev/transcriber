import { Section, Passage, IState, BookName } from '../../../model';
import { passageDescText } from '../../../crud/passage';
import { sectionNumber } from '../../../crud/section';
import { useSelector } from 'react-redux';
import { getSection } from '../../AudioTab/getSection';
import {
  projDefSectionMap,
  useProjectDefaults,
} from '../../../crud/useProjectDefaults';

export interface IInfo {
  secNum: number;
  section: Section;
  passage: Passage | undefined;
}

const getPassage = (
  info: IInfo,
  bookData: BookName[],
  sectionMap: Map<number, string>
) => {
  return `${sectionNumber(info.section, sectionMap)}.${passageDescText(
    info.passage as Passage,
    bookData
  ).trim()}`;
};

export const useFullReference = (inBookData?: BookName[]) => {
  const bookData = useSelector((state: IState) => state.books.bookData);
  const { getProjectDefault } = useProjectDefaults();
  const sectionMap = new Map<number, string>(
    getProjectDefault(projDefSectionMap) ?? []
  );

  return (info: IInfo) =>
    info.passage
      ? getPassage(info, inBookData ?? bookData, sectionMap)
      : getSection([info.section], sectionMap);
};
