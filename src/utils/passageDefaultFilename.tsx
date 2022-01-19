import { getVernacularMediaRec } from '../crud';
import { Passage } from '../model';
import Memory from '@orbit/memory';
import { cleanFileName } from '.';

export const passageDefaultFilename = (
  passageId: string,
  memory: Memory,
  vernacularId: string | undefined
) => {
  if (passageId) {
    var passageRec = memory.cache.query((q) =>
      q.findRecord({ type: 'passage', id: passageId })
    ) as Passage;
    var tmp =
      (passageRec.attributes.book || '') + passageRec.attributes.reference;
    if (!tmp.length) tmp = passageRec.id.slice(0, 4);

    if (vernacularId) {
      const mediaRec = getVernacularMediaRec(passageId, memory, vernacularId);
      if (mediaRec) {
        tmp += '_v' + (mediaRec.attributes.versionNumber + 1).toString();
      }
    }
    return cleanFileName(tmp);
  }
  return '';
};
