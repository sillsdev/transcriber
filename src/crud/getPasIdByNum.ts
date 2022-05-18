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
    const newValue = value > passages.length && passages.length > 1 ? 1 : value;
    passages.forEach((p) => {
      const passRec = findRecord(memory, 'passage', p.id) as Passage;
      const seq = passRec?.attributes?.sequencenum;
      const seqSliderValue = seq ? seq : -1;
      if (seqSliderValue === newValue) {
        pasId = passRec?.keys?.remoteId || passRec?.id;
      }
    });
  }
  return pasId;
};
