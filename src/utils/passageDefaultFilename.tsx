import { getVernacularMediaRec, VernacularTag } from '../crud';
import { Passage, Plan } from '../model';
import Memory from '@orbit/memory';
import { cleanFileName } from '.';

export const passageDefaultPrefix = (planId: string, memory: Memory) => {
  var planRec = memory.cache.query((q) =>
    q.findRecord({ type: 'plan', id: planId })
  ) as Plan;
  return planRec.attributes.slug + '_';
};
export const passageDefaultFilename = (
  passage: Passage,
  planId: string,
  memory: Memory,
  artifactType: string | null | undefined,
  postfix = ''
) => {
  if (passage?.attributes) {
    var tmp = (passage.attributes.book || '') + passage.attributes.reference;
    if (!tmp.length) tmp = passage.id.slice(0, 4);
    if (artifactType === VernacularTag) {
      const mediaRec = getVernacularMediaRec(passage.id, memory);
      if (mediaRec) {
        tmp += '_v' + (mediaRec.attributes.versionNumber + 1).toString();
      }
    }
    return cleanFileName(passageDefaultPrefix(planId, memory) + tmp + postfix);
  }
  return '';
};
