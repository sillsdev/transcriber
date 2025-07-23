import { useGlobal } from '../../../context/GlobalContext';
import related from '../../../crud/related';
import { useOrbitData } from '../../../hoc/useOrbitData';
import { PassageD, SectionD } from '../../../model';
import { parseRef } from '../../../crud/passage';
import { passageTypeFromRef } from '../../../control/RefRender';
import { PassageTypeEnum } from '../../../model/passageType';

const sortAscend = (a: PassageD, b: PassageD) =>
  a.attributes.sequencenum - b.attributes.sequencenum;
const sortDescend = (a: PassageD, b: PassageD) =>
  b.attributes.sequencenum - a.attributes.sequencenum;
const findPassage = (p: PassageD) =>
  passageTypeFromRef(p.attributes.reference) === PassageTypeEnum.PASSAGE;

export const useComputeRef = () => {
  const passages = useOrbitData<PassageD[]>('passage');
  const sections = useOrbitData<SectionD[]>('section');
  const [planId] = useGlobal('plan'); //will be constant here

  const computeMovementRef = (passage: PassageD) => {
    const sectionId = related(passage, 'section');
    const section = sections.find((s) => s.id === sectionId) as SectionD;
    const movements = sections
      .filter(
        (s) =>
          related(s, 'plan') === planId &&
          s.attributes.sequencenum !== Math.floor(s.attributes.sequencenum)
      )
      .sort((a, b) => b.attributes.sequencenum - a.attributes.sequencenum);
    const movementsB4 = movements.filter(
      (m) => m.attributes.sequencenum < section?.attributes.sequencenum
    );
    const movement = movementsB4.length > 0 ? movementsB4[0] : undefined;
    const sortedSections = sections
      .filter((s) => related(s, 'plan') === planId)
      .sort((a, b) => a.attributes.sequencenum - b.attributes.sequencenum);
    const startIndex = movement
      ? sortedSections.findIndex((s) => s.id === movement?.id)
      : 0;
    let endIndex = sortedSections.findIndex(
      (s) =>
        s.attributes.sequencenum > section?.attributes.sequencenum &&
        s.attributes.sequencenum !== Math.floor(s.attributes.sequencenum)
    );
    if (endIndex === -1) {
      endIndex = sortedSections.length;
    }
    let startChapter = undefined;
    let startVerse = undefined;
    for (let i = startIndex; i < endIndex; i++) {
      const secPass = passages.filter(
        (p) =>
          related(p, 'section') === sortedSections[i]?.id &&
          p.attributes.sequencenum === 1
      );
      if (secPass.length > 0) {
        parseRef(secPass[0]);
        startChapter = secPass[0]?.attributes.startChapter;
        startVerse = secPass[0]?.attributes.startVerse;
        break;
      }
    }
    let endChapter = undefined;
    let endVerse = undefined;
    for (let i = endIndex - 1; i >= startIndex; i--) {
      const secPass = passages
        .filter(
          (p) =>
            related(p, 'section') === sortedSections[i]?.id &&
            p.attributes.sequencenum === Math.floor(p.attributes.sequencenum)
        )
        .sort((a, b) => b.attributes.sequencenum - a.attributes.sequencenum);
      if (secPass.length > 0) {
        parseRef(secPass[0]);
        endChapter = secPass[0]?.attributes.endChapter;
        endVerse = secPass[0]?.attributes.endVerse;
        break;
      }
    }
    if (startChapter === endChapter) {
      return `${startChapter}:${startVerse}-${endVerse}`;
    } else {
      return `${startChapter}:${startVerse}-${endChapter}:${endVerse}`;
    }
  };

  const computeSectionRef = (passage: PassageD) => {
    const sectionId = related(passage, 'section');
    const sectPass = passages.filter(
      (p) => related(p, 'section') === sectionId
    );
    const firstPassage = sectPass.sort(sortAscend).find(findPassage);
    const lastPassage = sectPass.sort(sortDescend).find(findPassage);
    parseRef(firstPassage as PassageD);
    parseRef(lastPassage as PassageD);
    if (
      firstPassage?.attributes.startChapter ===
      lastPassage?.attributes.endChapter
    ) {
      return `${firstPassage?.attributes?.startChapter || 1}:${
        firstPassage?.attributes?.startVerse || 1
      }-${lastPassage?.attributes?.endVerse || 1}`;
    } else {
      return `${firstPassage?.attributes?.startChapter || 1}:${
        firstPassage?.attributes?.startVerse || 1
      }-${lastPassage?.attributes?.endChapter || 1}:${
        lastPassage?.attributes?.endVerse || 1
      }`;
    }
  };
  return { computeMovementRef, computeSectionRef };
};
