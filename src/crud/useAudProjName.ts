import { useGlobal } from 'reactn';
import { Plan, Passage, Section } from '../model';
import { RecordIdentity, Record } from '@orbit/data';
import { related, usePlan } from '.';
import { toCamel, pad2, cleanFileName } from '../utils';
const ipc = (window as any)?.electron;
const path = require('path-browserify');

const planSlug = (rec: Plan | null) => {
  const name = rec?.attributes?.name || '';
  return (
    rec?.attributes?.slug ||
    toCamel(cleanFileName(name.replace(' ', '_'))).slice(0, 6) +
      rec?.id.slice(0, 4)
  );
};

const recSlug = (rec: Record, seq: number) => {
  return `-${pad2(seq)}${rec.type.slice(0, 1)}${
    rec?.keys?.remoteId || rec?.id.slice(0, 4)
  }`;
};

export const useAudProjName = () => {
  const [memory] = useGlobal('memory');
  const { getPlan } = usePlan();

  return async (passageId: RecordIdentity) => {
    const passRec = memory.cache.query((q) =>
      q.findRecord(passageId)
    ) as Passage;
    const secId = related(passRec, 'section');
    const secRec = memory.cache.query((q) =>
      q.findRecord({ type: 'section', id: secId })
    ) as Section;
    const planRec = getPlan(related(secRec, 'plan'));
    const docs = await ipc?.getPath('documents');
    const book = passRec?.attributes?.book;
    const secSeq = secRec?.attributes?.sequencenum || 0;
    let secPart = `${book ?? ''}${recSlug(secRec, secSeq)}`;
    const ref = passRec?.attributes?.reference;
    const cleanRef = ref ? `-${cleanFileName(ref.replace(' ', '_'))}` : '';
    let aupPath = path.join(docs, 'Audacity', 'aup3', planSlug(planRec));
    let pasPart = '';
    if (planRec?.attributes?.flat) {
      secPart += cleanRef;
      aupPath = path.join(aupPath, secPart);
    } else {
      const pasSeq = passRec?.attributes?.sequencenum || 0;
      pasPart = cleanRef + recSlug(passRec, pasSeq);
      aupPath = path.join(aupPath, secPart, pasPart.slice(1));
    }
    return path.join(aupPath, `${secPart}${pasPart}_${planSlug(planRec)}.aup3`);
  };
};
