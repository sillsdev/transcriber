import { findRecord } from '../crud/tryFindRecord';
import { getVernacularMediaRec } from '../crud/media';
import { parseRef } from '../crud/passage';
import { related } from '../crud/related';
import { VernacularTag } from '../crud/useArtifactType';
import { Passage, PassageD, Plan, Section } from '../model';
import Memory from '@orbit/memory';
import { cleanFileName } from './cleanFileName';

export const passageDefaultSuffix = (
  planId: string,
  memory: Memory,
  offline: boolean
) => {
  var planRec = memory?.cache.query((q) =>
    q.findRecord({ type: 'plan', id: planId })
  ) as Plan;
  return '_' + (offline ? 'l' : '') + planRec.attributes.slug;
};
const pad3 = (n: number) => ('00' + n).slice(-3);

const noPassageRef = (passage: Passage, memory: Memory) => {
  var sect = findRecord(
    memory,
    'section',
    related(passage, 'section')
  ) as Section;
  var plan = findRecord(memory, 'plan', related(sect, 'plan')) as Plan;
  if (plan.attributes.flat && sect.attributes.name.length > 0)
    return sect.attributes.name;
  return `S${sect.attributes.sequencenum.toString().padStart(3, '0')}${
    plan.attributes.flat
      ? ''
      : `_P${passage.attributes.sequencenum.toString().padStart(3, '0')}`
  }`;
};
export const passageDefaultFilename = (
  passage: PassageD,
  planId: string,
  memory: Memory,
  artifactType: string | null | undefined,
  offline: boolean,
  postfix = ''
) => {
  if (passage?.attributes) {
    var tmp = '';
    parseRef(passage);
    var book = passage.attributes?.book ?? '';
    if (passage.attributes.startChapter) {
      const chap = pad3(passage.attributes.startChapter || 1);
      const endchap = pad3(
        passage.attributes.endChapter || passage.attributes.startChapter
      );
      const start = pad3(passage.attributes.startVerse || 1);
      const end = pad3(
        passage.attributes.endVerse || passage?.attributes.startVerse || 1
      );
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
          : noPassageRef(passage, memory)
      );
      tmp = `${book}${title}`;
    }
    if (artifactType === VernacularTag) {
      const mediaRec = getVernacularMediaRec(passage.id, memory);
      if (mediaRec) {
        tmp += '_v' + (mediaRec.attributes.versionNumber + 1).toString();
      }
    }
    return (
      tmp +
      postfix +
      (planId ? passageDefaultSuffix(planId, memory, offline) : '')
    );
  }
  return '';
};
