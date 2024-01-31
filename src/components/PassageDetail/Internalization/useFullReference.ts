import { Section, Passage, IState, BookName } from '../../../model';
import { passageDescText, sectionNumber } from '../../../crud';
import { useSelector } from 'react-redux';
import { getSection } from '../../AudioTab/getSection';
import { useProjectDefaults } from '../../../crud/useProjectDefaults';
import { SectionMap } from '../../../context/PlanContext';

export interface IInfo {
  secNum: number;
  section: Section;
  passage: Passage | undefined;
}

const getPassage = (info: IInfo, bookData: BookName[], sectionMap: Map<number, string>) => {
  return `${sectionNumber(info.section, sectionMap)}.${passageDescText(
    info.passage as Passage,
    bookData
  ).trim()}`;
};

export const useFullReference = () => {
  const bookData = useSelector((state: IState) => state.books.bookData);
  const {getProjectDefault} = useProjectDefaults()
  const sectionMap = new Map<number, string>(getProjectDefault(SectionMap) ?? []);

  return (info: IInfo) =>
    info.passage
      ? getPassage(info, bookData, sectionMap)
      : getSection([info.section], sectionMap);
};
