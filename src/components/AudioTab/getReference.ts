import { Passage, BookName } from '../../model';
import { passageReference } from '../../crud';

export const getReference = (passage: Passage[], bookData: BookName[] = []) => {
  if (passage.length === 0) return '';
  return passageReference(passage[0], bookData);
};
