import { MediaFile, Passage, Section, BookName } from '../../model';
import { related } from '../../crud';
import { refMatch } from '../../utils';
import { IPRow, getSection, getReference, isAttached, pad } from '.';

enum StatusL {
  No = 'N',
  Proposed = 'P',
  Yes = 'Y',
}

export interface IPassageData {
  media: MediaFile[];
  allBookData: BookName[];
}

export const passageRow = (
  passage: Passage,
  section: Section,
  data: IPassageData
) => {
  const { media, allBookData } = data;
  const refMat = refMatch(passage.attributes.reference);
  return {
    id: passage.id,
    sectionId: section.id,
    sectionDesc: getSection([section]),
    reference: getReference([passage], allBookData),
    attached: isAttached(passage, media) ? StatusL.Yes : StatusL.No,
    sort: `${pad(section.attributes.sequencenum)}.${pad(
      passage.attributes.sequencenum
    )}`,
    book: passage.attributes.book,
    chap: (refMat && parseInt(refMat[1])) || -1,
    beg: (refMat && refMat.length > 2 && parseInt(refMat[2])) || -1,
    end: (refMat && refMat.length > 3 && parseInt(refMat[3])) || -1,
    pasNum: passage.attributes.sequencenum,
    secNum: section.attributes.sequencenum,
  };
};

export const getPassages = (
  planId: string,
  passages: Passage[],
  sections: Section[],
  data: IPassageData
) => {
  const prowData: IPRow[] = [];

  const selSects = sections.filter((s) => related(s, 'plan') === planId);
  selSects.forEach((section) => {
    const sectionId = section.id;
    passages
      .filter((p) => related(p, 'section') === sectionId)
      .forEach((passage) => {
        prowData.push(passageRow(passage, section, data));
      });
  });
  return prowData;
};
