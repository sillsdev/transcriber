import { passageTypeFromRef } from '../../../control/RefRender';
import { useNotes } from '../../../crud/useNotes';
import { PassageD } from '../../../model';
import { PassageTypeEnum } from '../../../model/passageType';

export const usePassageRef = () => {
  const { curNoteRef, shortBook } = useNotes();

  /**
   * Returns a function that generates a passage reference text.
   * If the passage is a note, it formats it differently.
   * @returns {function(PassageD): string | null} - Function to generate passage reference text.
   */
  const passageRef = (passage: PassageD) => {
    if (passage) {
      const pt = passageTypeFromRef(passage?.attributes?.reference);
      if (pt === PassageTypeEnum.NOTE) {
        return `${shortBook(passage?.attributes?.book || 'MAT')} ${
          curNoteRef(passage) || '1:1'
        }`;
      } else {
        return `${shortBook(passage?.attributes?.book || 'MAT')} ${
          passage?.attributes?.reference || '1:1'
        }`;
      }
    }
    return null;
  };

  return { passageRef };
};
