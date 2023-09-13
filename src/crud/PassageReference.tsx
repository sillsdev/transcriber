import { refRender } from '../control/RefRender';
import { Passage, BookName } from '../model';
import { passageBook } from './passage';

export const PassageReference = (
  passage: Passage,
  bookData: BookName[] = []
) => {
  const book = passageBook(passage, bookData);
  return book ? (
    <>
      {book}
      {`\u00A0`}
      {refRender(passage?.attributes?.reference)}
    </>
  ) : (
    <>{refRender(passage?.attributes?.reference)}</>
  );
};
