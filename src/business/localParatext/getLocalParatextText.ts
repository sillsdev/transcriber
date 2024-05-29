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
  const chap = crossChapterRefs(pass);
  const chapKey = pass.attributes.book + '-' + (chap ?? '1');
  const paths = await paratextPaths(chapKey);

  let usxDom: Document = await readChapter(paths, ptProjName);
  return getPassageVerses(usxDom, pass);
};
