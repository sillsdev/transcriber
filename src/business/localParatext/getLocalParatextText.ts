import { parseRef } from '../../crud/passage';
import { Passage } from '../../model';
import { crossChapterRefs } from './crossChapterRefs';
import { readChapter } from './readChapter';
import { paratextPaths } from './paratextPaths';
import { getPassageVerses } from './usxNodeContent';

export const getLocalParatextText = async (
  pass: Passage,
  ptProjName: string
) => {
  pass.attributes.startChapter = undefined;
  parseRef(pass);
  let chap = crossChapterRefs(pass);
  let transcription = '';
  if (chap !== pass.attributes.startChapter) {
    transcription += `\\c ${chap} `;
  }
  let chapKey = pass.attributes.book + '-' + (chap ?? '1');
  let paths = await paratextPaths(chapKey);

  let usxDom: Document = await readChapter(paths, ptProjName);
  transcription += getPassageVerses(usxDom, pass);
  if (chap !== pass.attributes.endChapter) {
    pass.attributes.startChapter = undefined;
    parseRef(pass);
    chap = pass.attributes.endChapter;
    pass.attributes.startChapter = chap;
    pass.attributes.startVerse = 1;
    chapKey = pass.attributes.book + '-' + (chap ?? '1');
    paths = await paratextPaths(chapKey);
    usxDom = await readChapter(paths, ptProjName);
    transcription += `\\c ${chap} ` + getPassageVerses(usxDom, pass);
  }
  return transcription;
};
