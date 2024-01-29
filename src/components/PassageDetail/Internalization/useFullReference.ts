import { Section, Passage, IState, BookName } from '../../../model';
import { passageDescText } from '../../../crud';
import { useSelector } from 'react-redux';
import { getSection } from '../../AudioTab/getSection';
import { useContext } from 'react';
import { PassageDetailContext } from '../../../context/PassageDetailContext';

export interface IInfo {
  rec: Section | Passage;
  secNum: number;
}

const getPassage = (info: IInfo, bookData: BookName[]) => {
  return `${info.secNum}.${passageDescText(
    info.rec as Passage,
    bookData
  ).trim()}`;
};

export const useFullReference = () => {
  const bookData = useSelector((state: IState) => state.books.bookData);
  const { sectionArr } = useContext(PassageDetailContext).state;
  const sectionMap = new Map<number, string>(sectionArr);

  return (info: IInfo) =>
    info.rec.type === 'passage'
      ? getPassage(info, bookData)
      : getSection([info.rec as Section], sectionMap);
};
