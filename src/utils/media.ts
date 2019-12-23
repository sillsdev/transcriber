import {
  MediaFile,
  Plan,
  Project,
  Passage,
  Section,
  PassageSection,
} from '../model';
import { QueryBuilder, RecordIdentity } from '@orbit/data';
import Memory from '@orbit/memory';
import { related } from '.';

export const getMediaRec = (passageId: string, memory: Memory) => {
  const mediaRecs = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('mediafile').filter({
      relation: 'passage',
      record: { type: 'passage', id: passageId },
    })
  ) as MediaFile[];
  return mediaRecs.length > 0 ? mediaRecs[0] : null;
};

export const getMediaPlanRec = (rec: MediaFile | null, memory: Memory) => {
  let planRec: Plan | undefined = undefined;
  if (rec) {
    const planId = related(rec, 'plan') as string;
    planRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'plan', id: planId })
    ) as Plan;
  }
  return planRec;
};

export const getMediaProjRec = (rec: MediaFile | null, memory: Memory) => {
  let projRec: Project | undefined = undefined;
  if (rec) {
    const planRec = getMediaPlanRec(rec, memory);
    const projId = related(planRec, 'project') as string;
    projRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'project', id: projId })
    ) as Project;
  }
  return projRec;
};

export const getMediaLang = (rec: MediaFile | null, memory: Memory) => {
  const projRec = getMediaProjRec(rec, memory);
  return projRec && projRec.attributes && projRec.attributes.language;
};

export const getMediaName = (rec: MediaFile | null, memory: Memory) => {
  let passageRec: Passage | undefined = undefined;
  const passageId = related(rec, 'passage');
  if (passageId)
    passageRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'passage', id: passageId })
    ) as Passage;
  const passageSectionIds = related(passageRec, 'sections') as Array<
    RecordIdentity
  >;
  const secIds = passageSectionIds.map(psId => {
    const psRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord(psId)
    ) as PassageSection;
    return related(psRec, 'section');
  });
  const secRec = memory.cache.query((q: QueryBuilder) =>
    q.findRecord({ type: 'section', id: secIds[0] })
  ) as Section;
  const secAttr = secRec && secRec.attributes;
  const secSeq =
    secAttr && secAttr.sequencenum && secAttr.sequencenum.toString();
  const attr = passageRec && passageRec.attributes;
  const book = attr && attr.book;
  const ref = attr && attr.reference;
  const seq = attr && attr.sequencenum && attr.sequencenum.toString();
  const ver =
    rec &&
    rec.attributes &&
    rec.attributes.versionNumber &&
    rec.attributes.versionNumber.toString();
  const planRec = getMediaPlanRec(rec, memory);
  const planName = planRec && planRec.attributes && planRec.attributes.name;
  const projRec = getMediaProjRec(rec, memory);
  const projName = projRec && projRec.attributes && projRec.attributes.name;
  let val = projName + '_' + planName + '_';
  if (book && book !== '') val = val + book + '_';
  val = val + secSeq + '-' + seq + '_' + ref + 'v' + ver;
  val = val.replace(/:/g, '_');
  return encodeURIComponent(val);
};
