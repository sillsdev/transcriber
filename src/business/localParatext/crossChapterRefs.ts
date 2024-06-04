import { Passage } from '../../model';
import { getLastVerse } from './getLastVerse';

export const crossChapterRefs = (pass: Passage) => {
  const { book, startChapter, endChapter, startVerse, endVerse } =
    pass.attributes;
  let chap = startChapter;
  if (chap) {
    if (endChapter && endChapter !== chap) {
      if (endChapter !== chap + 1)
        throw Error(`Chapter range (${chap}-${endChapter}) too large`);
      const lastVerse = getLastVerse(book, chap);
      if (endVerse && startVerse && lastVerse) {
        if (endVerse > lastVerse - startVerse + 1) {
          // put content in chapter with most verses
          chap = endChapter;
          pass.attributes.startVerse = 1;
        } else {
          pass.attributes.endVerse = lastVerse;
        }
      }
    }
  }
  return chap;
};
