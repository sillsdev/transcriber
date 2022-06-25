import { Section, Passage, IState, BookName } from '../../../model';
import { passageDescription, sectionNumber } from '../../../crud';
import { useSelector } from 'react-redux';

export interface IInfo {
  rec: Section | Passage;
  secNum: number;
}

const getSection = (section: Section) => {
  const name =
    section && section.attributes && section.attributes.name
      ? section.attributes.name
      : '';
  return sectionNumber(section) + ' ' + name;
};

const getPassage = (info: IInfo, bookData: BookName[]) => {
  return `${info.secNum}.${passageDescription(
    info.rec as Passage,
    bookData
  ).trim()}`;
};

export const useFullReference = () => {
  const bookData = useSelector((state: IState) => state.books.bookData);

  return (info: IInfo) =>
    info.rec.type === 'passage'
      ? getPassage(info, bookData)
      : getSection(info.rec as Section);
};
