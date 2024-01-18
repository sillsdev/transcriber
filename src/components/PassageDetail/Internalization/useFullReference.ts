import { Section, Passage, IState, BookName } from '../../../model';
import { passageDescText } from '../../../crud';
import { useSelector } from 'react-redux';
import { getSection } from '../../AudioTab/getSection';
import useLocalStorageState from '../../../utils/useLocalStorageState';

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
  const [sectionMap] = useLocalStorageState(
    'sectionMap',
    new Map<number, string>()
  );

  return (info: IInfo) =>
    info.rec.type === 'passage'
      ? getPassage(info, bookData)
      : getSection([info.rec as Section], sectionMap);
};
