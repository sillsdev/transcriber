import { useGlobal } from 'reactn';
import {
  IState,
  Passage,
  PassageD,
  Plan,
  PlanD,
  ProjectD,
  SectionD,
  SharedResource,
  SharedResourceD,
} from '../model';
import related from './related';
import { useOrbitData } from '../hoc/useOrbitData';
import {
  findRecord,
  passageDescText,
  sectionDescription,
  usePlanType,
} from '.';
import { useSelector } from 'react-redux';
import { passageTypeFromRef } from '../control/RefRender';
import { PassageTypeEnum } from '../model/passageType';

export const useNotes = () => {
  const sharedResources = useOrbitData<SharedResourceD[]>('sharedresource');
  const [memory] = useGlobal('memory');
  const [organization] = useGlobal('organization');
  const planType = usePlanType();
  const allBookData = useSelector((state: IState) => state.books.bookData);

  const getNotes = () => {
    return sharedResources.filter((sr) => {
      const passRec = findRecord(
        memory,
        'passage',
        related(sr, 'passage')
      ) as PassageD[];
      const secRec = findRecord(
        memory,
        'section',
        related(passRec, 'section')
      ) as SectionD[];
      const planRec = findRecord(
        memory,
        'plan',
        related(secRec, 'plan')
      ) as PlanD[];
      const projRec = findRecord(
        memory,
        'project',
        related(planRec, 'project')
      ) as ProjectD[];
      if (related(projRec, 'organization') !== organization) return false;
      return sr?.attributes?.note ?? false;
    });
  };
  const bySeq = (i: Passage, j: Passage) => {
    return (
      (i?.attributes?.sequencenum ?? 0) - (j?.attributes?.sequencenum ?? 0)
    );
  };
  const noteRefs = (passage: PassageD): string[] => {
    const section = findRecord(
      memory,
      'section',
      related(passage, 'section') as string
    ) as SectionD;
    const secRefs: string[] = [];
    const passages = memory.cache.query((q) =>
      q.findRelatedRecords(section, 'passages')
    ) as PassageD[];
    passages.sort(bySeq).forEach((recId) => {
      const passRec = findRecord(memory, 'passage', recId.id) as Passage;
      const passType = passageTypeFromRef(passRec.attributes.reference, false); //do I need to figure out flat??
      if (passType === PassageTypeEnum.PASSAGE)
        secRefs.push(passRec.attributes.reference);
    });
    return secRefs;
  };
  const noteSource = (r: SharedResource): string => {
    const rec = findRecord(
      memory,
      'passage',
      related(r, 'passage')
    ) as PassageD;
    if (!rec?.attributes) return '';
    let source = '';
    const secRec = findRecord(
      memory,
      'section',
      related(rec, 'section')
    ) as SectionD;
    const myPlan = related(secRec, 'plan');
    const planRec = findRecord(memory, 'plan', myPlan) as Plan;
    if (planRec?.attributes) {
      source += planRec.attributes.name + ':';
    }
    if (!planType(myPlan)?.scripture) {
      if (secRec?.attributes) {
        if (source.length > 0) source += ' - ';
        source += sectionDescription(secRec, new Map<number, string>());
      }
    } else {
      // make a copy so we don't impact the passage on the sheet
      const passRec = { ...rec, attributes: { ...rec.attributes } };
      const secRefs = noteRefs(passRec);
      const fromRef = secRefs.length > 1 ? secRefs[0].split('-')[0] : '';
      const fromchap = fromRef.split(':')[0];
      const toRef = secRefs.length > 1 ? secRefs[secRefs.length - 1] : '';
      const tochap = toRef.split(':')[0];
      const toVerseArr = toRef.split('-');
      const toVerse = toVerseArr.length > 1 ? toVerseArr[1] : '';
      if (passRec?.attributes) {
        passRec.attributes.reference =
          toVerse.length === 0
            ? fromRef
            : fromchap === tochap || tochap.length === 0
            ? `${fromRef}-${toVerse}`
            : `${fromRef}-${tochap}:${toVerse}`;
      }
      source += passageDescText(passRec, allBookData);
    }
    return source;
  };
  return { getNotes, noteRefs, noteSource };
};
