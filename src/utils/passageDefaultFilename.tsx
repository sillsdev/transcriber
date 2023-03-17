import { getVernacularMediaRec, parseRef, VernacularTag } from '../crud';
import { Passage, Plan } from '../model';
import Memory from '@orbit/memory';
import { cleanFileName } from '.';

export const passageDefaultPrefix = (planId: string, memory: Memory) => {
  var planRec = memory.cache.query((q) =>
    q.findRecord({ type: 'plan', id: planId })
  ) as Plan;
  return planRec.attributes.slug + '_';
};
const pad3 = (n: number) => ('00' + n).slice(-3);

export const passageDefaultFilename = (
  passage: Passage,
  planId: string,
  memory: Memory,
  artifactType: string | null | undefined,
  postfix = ''
) => {
  if (passage?.attributes) {
    var tmp = '';
    parseRef(passage);
    var book = passage.attributes?.book ?? '';
    if (passage.startChapter) {
      const chap = pad3(passage.startChapter || 1);
      const endchap = pad3(passage.endChapter || passage.startChapter);
      const start = pad3(passage.startVerse || 1);
      const end = pad3(passage.endVerse || passage?.startVerse || 1);
      tmp =
        chap === endchap
          ? start === end
            ? `${book}${chap}_${start}`
            : `${book}${chap}_${start}-${end}`
          : `${book}${chap}_${start}-${endchap}_${end}`;
    } else {
      var title = cleanFileName(
        passage.attributes.reference?.length > 0
          ? passage.attributes.reference
          : passage.attributes.title
      );
      tmp = `${book}${title}`;
    }
    if (artifactType === VernacularTag) {
      const mediaRec = getVernacularMediaRec(passage.id, memory);
      if (mediaRec) {
        tmp += '_v' + (mediaRec.attributes.versionNumber + 1).toString();
      }
    }
    return (planId ? passageDefaultPrefix(planId, memory) : '') + tmp + postfix;
  }
  return '';
};
