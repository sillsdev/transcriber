import { Section, Passage } from '../model';
import Memory from '@orbit/memory';
import { related, findRecord } from '.';

export const getPasIdByNum = (
  section: Section,
  value: number,
  memory: Memory
) => {
  let pasId = '';
  const passages = related(section, 'passages');
  if (Array.isArray(passages)) {
    passages.forEach((p) => {
      const passRec = findRecord(memory, 'passage', p.id) as Passage;
      const seq = passRec?.attributes?.sequencenum;
      const seqSliderValue = seq ? seq : -1;
      if (seqSliderValue === value) {
        pasId = passRec?.keys?.remoteId || passRec?.id;
      }
    });
  }
  return pasId;
};
