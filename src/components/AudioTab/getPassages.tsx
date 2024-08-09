import { MediaFile, BookName, PassageD, SectionD } from '../../model';
import { related } from '../../crud/related';
import { refMatch } from '../../utils/refMatch';
import { IPRow } from './IPRow';
import { isAttached } from './isAttached';
import { pad } from './pad';
import { GetReference } from './GetReference';
import { getSection } from './getSection';

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
  passage: PassageD,
  section: SectionD,
  data: IPassageData
) => {
  const { media, allBookData } = data;
  const refMat = refMatch(passage.attributes.reference);
  const chap = refMat && refMat.length > 1 ? parseInt(refMat[1]) : -1;
  const endIdx = refMat && refMat.length > 4 && refMat[4] ? 4 : 3;

  return {
    id: passage.id,
    sectionId: section.id,
    sectionDesc: getSection([section]),
    reference: (
      <GetReference passage={[passage]} bookData={allBookData} flat={false} />
    ),
    attached: isAttached(passage, media) ? StatusL.Yes : StatusL.No,
    sort: `${pad(section.attributes.sequencenum)}.${pad(
      passage.attributes.sequencenum
    )}`,

    // Used for Reference matching
    book: passage.attributes.book,
    chap,
    beg: (refMat && refMat.length > 2 && parseInt(refMat[2])) || -1,
    endChap:
      refMat && refMat.length > 4 && refMat[4]
        ? parseInt(refMat[3]) || chap
        : -1,
    end: refMat ? parseInt(refMat[endIdx]) || -1 : -1,
    pasNum: passage.attributes.sequencenum,
    secNum: section.attributes.sequencenum,
  };
};

export const getPassages = (
  planId: string,
  passages: PassageD[],
  sections: SectionD[],
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
