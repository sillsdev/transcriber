import { useGlobal } from 'reactn';
import { Section, Passage, IState } from '../../../model';
import { findRecord, related, passageDescription } from '../../../crud';
import { useSelector } from 'react-redux';

export const useFullReference = () => {
  const [memory] = useGlobal('memory');
  const bookData = useSelector((state: IState) => state.books.bookData);

  return (p: Passage) => {
    const secRec = findRecord(memory, 'section', related(p, 'section')) as
      | Section
      | undefined;
    return `${secRec?.attributes?.sequencenum}.${passageDescription(
      p,
      bookData
    ).trim()}`;
  };
};
