import { useGlobal } from 'reactn';
import { PassageD, PlanD, ProjectD, SectionD, SharedResourceD } from '../model';
import related from './related';
import { useOrbitData } from '../hoc/useOrbitData';
import { findRecord } from '.';

export const useNotes = () => {
  const sharedResources = useOrbitData<SharedResourceD[]>('sharedresource');
  const [memory] = useGlobal('memory');
  const [organization] = useGlobal('organization');

  return () => {
    return sharedResources.filter((sr) => {
      const passRec = findRecord(memory, 'passage', related(sr, 'passage')) as PassageD[]
      const secRec = findRecord(memory, 'section', related(passRec, 'section')) as SectionD[]
      const planRec = findRecord(memory, 'plan', related(secRec, 'plan')) as PlanD[]
      const projRec = findRecord(memory, 'project', related(planRec, 'project')) as ProjectD[]
      if (related(projRec, 'organization') !== organization) return false
      return sr?.attributes?.note ?? false
    });
  };
};
