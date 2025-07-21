import usePassageDetailContext from '../../../context/usePassageDetailContext';
import { passageTypeFromRef } from '../../../control/RefRender';
import { passageRefText } from '../../../crud/passage';
import { useNotes } from '../../../crud/useNotes';
import { PassageD } from '../../../model';
import { PassageTypeEnum } from '../../../model/passageType';

export const usePassageRef = () => {
  const { noteRefs } = useNotes();
  const { allBookData } = usePassageDetailContext();

  const shortBook = (book: string): string => {
    const bookData = allBookData.find((b) => b.code === book);
    return bookData ? bookData.short : book;
  };
  /**
   * Returns a function that generates a passage reference text.
   * If the passage is a note, it formats it differently.
   * @returns {function(PassageD): string | null} - Function to generate passage reference text.
   */
  return (passage: PassageD) => {
    if (passage) {
      const pt = passageTypeFromRef(passage?.attributes?.reference);
      if (pt === PassageTypeEnum.NOTE) {
        return `${shortBook(passage?.attributes?.book || 'MAT')} ${
          noteRefs(passage).join('; ') || '1:1'
        }`;
      } else {
        return passageRefText(passage);
      }
    }
    return null;
  };
};
