import { useGlobal } from '../mods/reactn';
import { Discussion } from '../model';
import { findRecord, related } from '.';

export const useDiscussionOrg = () => {
  const [memory] = useGlobal('memory');
  return (d: Discussion) => {
    const id = related(d, 'orgWorkflowStep');
    if (!id) return '';
    const rec = findRecord(memory, 'orgworkflowstep', id);
    return related(rec, 'organization');
  };
};
