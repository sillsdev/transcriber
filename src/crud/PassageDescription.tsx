import { BookName, Passage } from '../model';
import { PassageReference } from './PassageReference';
import { passageNumber } from './passage';

export const PassageDescription = (
  passage: Passage,
  bookData: BookName[] = [],
  flat:boolean
) => {
  const num = passageNumber(passage);
  return num ? (
    <>
      {num}
      {'\u00A0\u00A0'}
      {PassageReference(passage, bookData, flat)}
    </>
  ) : (
    <>{PassageReference(passage, bookData, flat)}</>
  );
};
