import { refRender } from '../control/RefRender';
import { Passage, BookName } from '../model';
import { passageBook } from './passage';

export const PassageReference = (
  passage: Passage,
  bookData: BookName[] = [],
  flat: boolean
) => {
  const book = passageBook(passage, bookData);
  return book ? (
    <>
      {book}
      {`\u00A0`}
      {refRender(passage?.attributes?.reference, flat)}
    </>
  ) : (
    <>{refRender(passage?.attributes?.reference, flat)}</>
  );
};
