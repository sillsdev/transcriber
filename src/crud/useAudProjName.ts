import { useGlobal } from 'reactn';
import { Plan, Passage, Section } from '../model';
import { RecordIdentity } from '@orbit/data';
import { related, usePlan } from '.';
import { toCamel, pad2, cleanFileName } from '../utils';
import { isElectron } from '../api-variable';
const ipc = isElectron ? require('electron').ipcRenderer : null;
const path = require('path');

const makeSlug = (rec: Plan | null) => {
  const name = rec?.attributes?.name || '';
  return (
    rec?.attributes?.slug ||
    toCamel(cleanFileName(name.replace(' ', '_'))).slice(0, 6) +
      rec?.id.slice(0, 4)
  );
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
    const docs = await ipc?.invoke('getPath', 'documents');
    const book = passRec?.attributes?.book;
    const secseq = secRec.attributes.sequencenum;
    let secPart = `${book ? `${book}-` : ''}s${pad2(secseq)}`;
    const ref = passRec?.attributes?.reference;
    const cleanRef = cleanFileName(ref ? ref.replace(' ', '_') : '');
    let aupPath = path.join(docs, 'Audacity', makeSlug(planRec));
    let pasPart = '';
    if (planRec?.attributes?.flat) {
      secPart += `-${cleanRef}`;
      aupPath = path.join(aupPath, secPart);
    } else {
      const pasSeq = passRec?.attributes?.sequencenum;
      pasPart = `p${pad2(pasSeq)}-${cleanRef}`;
      aupPath = path.join(aupPath, secPart, pasPart);
      pasPart = `-${pasPart}`;
    }
    return path.join(aupPath, `${makeSlug(planRec)}-${secPart}${pasPart}.aup3`);
  };
};
