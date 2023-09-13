import { Passage, BookName } from '../../model';
import { PassageReference } from '../../crud';

export const getReference = (passage: Passage[], bookData: BookName[] = []) => {
  if (passage.length === 0) return '';
  return PassageReference(passage[0], bookData);
};
